/*
  Controlador de Autenticación
  TechRetail Solutions S.R.L.
  
 */

const Usuario = require('../../usuarios/models/Usuario');
const Plan = require('../../Planes/models/Plan');

// GET /login — Renderiza la vista de login
const vistaLogin = (req, res) => {
  res.render('login', {
    titulo: 'Iniciar Sesión',
    registrado: req.query.registrado === '1',
  });
};

// GET /registro — Renderiza la vista de registro público
const vistaRegistro = async (req, res) => {
  try {
    const planes = await Plan.find({ tipo: 'plan', activo: true }).sort({ precio: 1 });
    res.render('registro', { titulo: 'Crear cuenta', planes });
  } catch (error) {
    res.render('registro', { titulo: 'Crear cuenta', planes: [], error: 'Error al cargar los planes.' });
  }
};

// POST /registro — Crea una cuenta de cliente
const registrarUsuario = async (req, res) => {
  const { nombre, email, empresa, telefono, contrasena, planSeleccionado } = req.body;
  const getPlanes = () => Plan.find({ tipo: 'plan', activo: true }).sort({ precio: 1 }).catch(() => []);

  try {
    if (!nombre || !email || !contrasena) {
      return res.status(400).render('registro', {
        titulo: 'Crear cuenta',
        planes: await getPlanes(),
        error: 'Nombre, email y contraseña son obligatorios.',
      });
    }

    const existente = await Usuario.findOne({ email: email.toLowerCase() }).select('_id');
    if (existente) {
      return res.status(400).render('registro', {
        titulo: 'Crear cuenta',
        planes: await getPlanes(),
        error: 'Ya existe una cuenta con ese email.',
      });
    }

    let planId = null;
    let trialHasta = null;

    if (!planSeleccionado || planSeleccionado === 'trial') {
      trialHasta = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    } else {
      const plan = await Plan.findById(planSeleccionado);
      if (plan) planId = plan._id;
    }

    await Usuario.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      empresa: empresa?.trim(),
      telefono: telefono?.trim(),
      contrasena,
      planId,
      trialHasta,
      rol: 'cliente',
      estado: 'activo',
    });

    res.redirect('/login?registrado=1');
  } catch (error) {
    console.error('Error al registrar usuario:', error.message);
    res.status(400).render('registro', {
      titulo: 'Crear cuenta',
      planes: await getPlanes(),
      error: 'Error al crear la cuenta. Verificá los datos ingresados.',
    });
  }
};

// POST /login — Valida credenciales y crea sesión
const loginUsuario = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    // Validar que lleguen email y contraseña
    if (!email || !contrasena) {
      return res.status(400).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario por email (select: false para incluir contraseña)
    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+contrasena');

    // Si no existe el usuario
    if (!usuario) {
      return res.status(401).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email o contraseña incorrectos'
      });
    }

    // Comparar contraseña ingresada con la hasheada
    const contrasenaValida = await usuario.compararContrasena(contrasena);

    if (!contrasenaValida) {
      return res.status(401).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Email o contraseña incorrectos'
      });
    }

    // Validar que el usuario esté activo
    if (usuario.estado !== 'activo') {
      return res.status(403).render('login', {
        titulo: 'Iniciar Sesión',
        error: 'Tu cuenta está inactiva'
      });
    }

    // Crear sesión del usuario
    req.session.usuario = {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    console.log(`✓ Login exitoso: ${usuario.email} (${usuario.rol})`);

    // Redirigir según el rol
    if (usuario.rol === 'admin') {
      res.redirect('/planes/vista');
    } else {
      res.redirect('/');
    }

  } catch (error) {
    console.error('Error al hacer login:', error.message);
    res.status(500).render('login', {
      titulo: 'Iniciar Sesión',
      error: 'Error al iniciar sesión. Intenta nuevamente.'
    });
  }
};

// POST /logout — Destruye la sesión
const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error);
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al cerrar sesión'
      });
    }

    console.log('✓ Logout exitoso');
    res.clearCookie('connect.sid'); // le dice al cliente que borre la cookie
    res.redirect('/login');
  });
};

module.exports = {
  vistaLogin,
  loginUsuario,
  logout,
  vistaRegistro,
  registrarUsuario,
};