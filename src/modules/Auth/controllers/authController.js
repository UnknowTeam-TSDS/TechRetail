/*
  Controlador de Autenticación
  TechRetail Solutions S.R.L.
*/

const Usuario = require('../../usuarios/models/Usuario');
const Plan = require('../../Planes/models/Plan');
const { validarContrasenaSegura } = require('../passwordPolicy');
const { emitirSocket, flash } = require('../../../utils/helpers');
const { obtenerEstadoSuscripcion } = require('../../../utils/suscripcion');

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

    const errorContrasena = validarContrasenaSegura(contrasena);
    if (errorContrasena) {
      return res.status(400).render('registro', {
        titulo: 'Crear cuenta',
        error: errorContrasena,
      });
    }

    const existente = await Usuario.findOne({ email: email.toLowerCase() }).select('_id');
    if (existente) {
      return res.status(400).render('registro', {
        titulo: 'Crear cuenta',
        error: 'Ya existe una cuenta con ese email.',
      });
    }

    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      empresa: empresa?.trim(),
      telefono: telefono?.trim(),
      contrasena,
      rol: 'cliente',
      estado: 'activo',
    });

    // Notificar a los admins conectados que entró un nuevo cliente
    emitirSocket(req, 'nuevo-usuario', { nombre: nuevoUsuario.nombre, email: nuevoUsuario.email });

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

    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() }).select('+contrasena');

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
      return res.redirect('/');
    }

    // Cliente: si el admin le creó la cuenta, debe cambiar contraseña primero
    if (usuario.cambiarContrasena) {
      return res.redirect('/cambiar-contrasena');
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

    const estadoSuscripcion = obtenerEstadoSuscripcion(usuarioActual);
    let diasTrial = null;
    if (estadoSuscripcion.enTrial) {
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
      enTrial: estadoSuscripcion.enTrial,
      trialVencido: estadoSuscripcion.trialVencido,
      trialUtilizado: usuarioActual.trialUtilizado,
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
    const [plan, usuario] = await Promise.all([
      Plan.findOne({ _id: planId, tipo: 'plan', activo: true }),
      Usuario.findById(req.session.usuario.id),
    ]);
    if (!plan || !usuario) return res.redirect('/elegir-plan');

    const updates = { planId: plan._id };

    // La prueba de Starter se concede una sola vez. Si ya fue usada, elegirlo
    // nuevamente representa el pago simulado del plan.
    if (plan.nombre.toLowerCase() === 'starter') {
      if (!usuario.trialUtilizado && !usuario.planId) {
        updates.trialHasta = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        updates.trialUtilizado = true;
      } else {
        updates.trialHasta = null;
      }
    } else {
      updates.trialHasta = null;
    }

    await Usuario.findByIdAndUpdate(req.session.usuario.id, updates);
    emitirSocket(req, 'plan-seleccionado', {
      usuario: req.session.usuario.nombre,
      plan: plan.nombre,
      enTrial: !!updates.trialHasta,
    });
    res.redirect('/mi-cuenta');
  } catch (error) {
    console.error('Error al seleccionar plan:', error.message);
    res.redirect('/elegir-plan');
  }
};

// GET /mi-cuenta — dashboard del cliente
const vistaCliente = async (req, res) => {
  try {
    const [usuario, todosLosAddons] = await Promise.all([
      Usuario.findById(req.session.usuario.id),
      Plan.find({ tipo: 'addon', activo: true }),
    ]);

    const estadoSuscripcion = obtenerEstadoSuscripcion(usuario);
    let diasTrial = null;
    if (estadoSuscripcion.enTrial) {
      diasTrial = Math.ceil((new Date(usuario.trialHasta) - new Date()) / (1000 * 60 * 60 * 24));
    }

    const idsContratados = (usuario.addons || []).map(a => String(a._id || a));
    const addonsDisponibles = todosLosAddons.filter(a => !idsContratados.includes(String(a._id)));

    res.render('mi-cuenta', {
      titulo: 'Mi cuenta',
      usuario: req.session.usuario,
      planActual: usuario.planId,
      enTrial: estadoSuscripcion.enTrial,
      trialVencido: estadoSuscripcion.trialVencido,
      diasTrial,
      planPago: estadoSuscripcion.planPago,
      addonsContratados: usuario.addons || [],
      addonsDisponibles,
      onboardingSolicitado: req.query.onboarding === '1',
    });
  } catch (error) {
    console.error('Error cargando mi cuenta:', error.message);
    res.redirect('/login');
  }
};

// POST /mis-addons/agregar
const agregarAddon = async (req, res) => {
  const { addonId } = req.body;
  try {
    const [addon, usuario] = await Promise.all([
      Plan.findOne({ _id: addonId, tipo: 'addon', activo: true }),
      Usuario.findById(req.session.usuario.id),
    ]);

    if (!addon) return res.redirect('/mi-cuenta');

    const { planPago } = obtenerEstadoSuscripcion(usuario);
    if (!planPago) {
      flash(req, 'error', 'Los add-ons requieren un plan pago activo.');
      return res.redirect('/mi-cuenta');
    }

    if (addon.precio > 0) {
      flash(req, 'error', 'Este add-on todavía no está disponible para contratar.');
      return res.redirect('/mi-cuenta');
    }

    await Usuario.findByIdAndUpdate(
      req.session.usuario.id,
      { $addToSet: { addons: addon._id } }
    );

    const redirect = addon.precio === 0 ? '/mi-cuenta?onboarding=1' : '/mi-cuenta';
    res.redirect(redirect);
  } catch (error) {
    console.error('Error al agregar add-on:', error.message);
    res.redirect('/mi-cuenta');
  }
};

// POST /mis-addons/quitar
const quitarAddon = async (req, res) => {
  const { addonId } = req.body;
  try {
    const addon = await Plan.findOne({ _id: addonId, tipo: 'addon' });
    if (!addon || addon.precio === 0) {
      flash(req, 'error', 'La guía de onboarding es un beneficio de uso único.');
      return res.redirect('/mi-cuenta');
    }

    await Usuario.findByIdAndUpdate(
      req.session.usuario.id,
      { $pull: { addons: addonId } }
    );
    res.redirect('/mi-cuenta');
  } catch (error) {
    console.error('Error al quitar add-on:', error.message);
    res.redirect('/mi-cuenta');
  }
};

// GET /cambiar-contrasena
const vistaCambiarContrasena = (req, res) => {
  res.render('cambiar-contrasena', { titulo: 'Cambiar contraseña' });
};

// POST /cambiar-contrasena
const actualizarContrasena = async (req, res) => {
  const { contrasena, confirmar } = req.body;

  const errorContrasena = validarContrasenaSegura(contrasena);
  if (errorContrasena) {
    return res.status(400).render('cambiar-contrasena', {
      titulo: 'Cambiar contraseña',
      error: errorContrasena,
    });
  }

  if (contrasena !== confirmar) {
    return res.status(400).render('cambiar-contrasena', {
      titulo: 'Cambiar contraseña',
      error: 'Las contraseñas no coinciden.',
    });
  }

  try {
    const usuario = await Usuario.findById(req.session.usuario.id).select('+contrasena');
    usuario.contrasena = contrasena;
    usuario.cambiarContrasena = false;
    await usuario.save();

    const tienePlan = !!(usuario.planId);
    const tieneTrialActivo = usuario.trialHasta && new Date(usuario.trialHasta) > new Date();

    if (tienePlan || tieneTrialActivo) {
      res.redirect('/mi-cuenta');
    } else {
      res.redirect('/elegir-plan');
    }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error.message);
    res.status(500).render('cambiar-contrasena', {
      titulo: 'Cambiar contraseña',
      error: 'Error al actualizar la contraseña. Intentá de nuevo.',
    });
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
  agregarAddon,
  quitarAddon,
  vistaCambiarContrasena,
  actualizarContrasena,
};
