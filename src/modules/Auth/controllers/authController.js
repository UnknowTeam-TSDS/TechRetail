/*
  Controlador de Autenticación
  TechRetail Solutions S.R.L.
*/

const Usuario = require('../../usuarios/models/Usuario');
const Plan = require('../../Planes/models/Plan');

// GET /login
const vistaLogin = (req, res) => {
  res.render('login', {
    titulo: 'Iniciar Sesión',
    registrado: req.query.registrado === '1',
  });
};

// GET /registro
const vistaRegistro = (req, res) => {
  res.render('registro', { titulo: 'Crear cuenta' });
};

// POST /registro — crea cuenta sin plan; el plan se elige al iniciar sesión
const registrarUsuario = async (req, res) => {
  const { nombre, email, empresa, telefono, contrasena } = req.body;

  try {
    if (!nombre || !email || !contrasena) {
      return res.status(400).render('registro', {
        titulo: 'Crear cuenta',
        error: 'Nombre, email y contraseña son obligatorios.',
      });
    }

    const existente = await Usuario.findOne({ email: email.toLowerCase() }).select('_id');
    if (existente) {
      return res.status(400).render('registro', {
        titulo: 'Crear cuenta',
        error: 'Ya existe una cuenta con ese email.',
      });
    }

    await Usuario.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      empresa: empresa?.trim(),
      telefono: telefono?.trim(),
      contrasena,
      rol: 'cliente',
      estado: 'activo',
    });

    res.redirect('/login?registrado=1');
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    res.status(400).render('registro', {
      titulo: 'Crear cuenta',
      error: 'Error al crear la cuenta. Verificá los datos ingresados.',
    });
  }
};

// POST /login
const loginUsuario = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email y contraseña son obligatorios',
      });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+contrasena');

    if (!usuario) {
      return res.status(401).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email o contraseña incorrectos',
      });
    }

    const contrasenaValida = await usuario.compararContrasena(contrasena);
    if (!contrasenaValida) {
      return res.status(401).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email o contraseña incorrectos',
      });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Tu cuenta está inactiva',
      });
    }

    req.session.usuario = {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    console.log(`✓ Login exitoso: ${usuario.email} (${usuario.rol})`);

    if (usuario.rol === 'admin') {
      return res.redirect('/planes/vista');
    }

    // Cliente: si tiene plan o trial activo → mi cuenta; si no → elegir plan
    const tienePlan = !!(usuario.planId);
    const tieneTrialActivo = usuario.trialHasta && new Date(usuario.trialHasta) > new Date();

    if (tienePlan || tieneTrialActivo) {
      res.redirect('/mi-cuenta');
    } else {
      res.redirect('/elegir-plan');
    }

  } catch (error) {
    console.error('Error al hacer login:', error.message);
    res.status(500).render('login', {
      titulo: 'Iniciar Sesión',
      error: 'Error al iniciar sesión. Intenta nuevamente.',
    });
  }
};

// POST /logout
const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error);
      return res.status(500).json({ ok: false, mensaje: 'Error al cerrar sesión' });
    }
    console.log('✓ Logout exitoso');
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

// GET /elegir-plan
const vistaElegirPlan = async (req, res) => {
  try {
    const [planes, usuarioActual] = await Promise.all([
      Plan.find({ tipo: 'plan', activo: true }).sort({ precio: 1 }),
      Usuario.findById(req.session.usuario.id),
    ]);

    let enTrial = false;
    let diasTrial = null;
    if (usuarioActual.trialHasta && new Date(usuarioActual.trialHasta) > new Date()) {
      enTrial = true;
      diasTrial = Math.ceil((new Date(usuarioActual.trialHasta) - new Date()) / (1000 * 60 * 60 * 24));
    }

    // planId puede estar populado (objeto) o ser solo un ObjectId
    const rawPlanId = usuarioActual.planId;
    const planActualId = rawPlanId
      ? String(rawPlanId._id || rawPlanId)
      : null;

    res.render('elegir-plan', {
      titulo: 'Elegir plan',
      planes,
      usuario: req.session.usuario,
      planActualId,
      enTrial,
      diasTrial,
    });
  } catch (error) {
    console.error('Error cargando planes:', error.message);
    res.render('elegir-plan', {
      titulo: 'Elegir plan', planes: [], usuario: req.session.usuario,
      planActualId: null, enTrial: false, diasTrial: null,
    });
  }
};

// POST /elegir-plan — asigna plan al cliente logueado
const seleccionarPlan = async (req, res) => {
  const { planId } = req.body;
  try {
    const plan = await Plan.findById(planId);
    if (!plan) return res.redirect('/elegir-plan');

    const updates = { planId: plan._id };

    // Starter tiene período de prueba de 14 días
    if (plan.nombre.toLowerCase() === 'starter') {
      updates.trialHasta = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }

    await Usuario.findByIdAndUpdate(req.session.usuario.id, updates);
    res.redirect('/mi-cuenta');
  } catch (error) {
    console.error('Error al seleccionar plan:', error.message);
    res.redirect('/elegir-plan');
  }
};

// GET /mi-cuenta — dashboard del cliente
const vistaCliente = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id);

    let diasTrial = null;
    let enTrial = false;
    if (usuario.trialHasta && new Date(usuario.trialHasta) > new Date()) {
      enTrial = true;
      diasTrial = Math.ceil((new Date(usuario.trialHasta) - new Date()) / (1000 * 60 * 60 * 24));
    }

    res.render('mi-cuenta', {
      titulo: 'Mi cuenta',
      usuario: req.session.usuario,
      planActual: usuario.planId,
      enTrial,
      diasTrial,
    });
  } catch (error) {
    console.error('Error cargando mi cuenta:', error.message);
    res.redirect('/login');
  }
};

module.exports = {
  vistaLogin,
  loginUsuario,
  logout,
  vistaRegistro,
  registrarUsuario,
  vistaElegirPlan,
  seleccionarPlan,
  vistaCliente,
};
