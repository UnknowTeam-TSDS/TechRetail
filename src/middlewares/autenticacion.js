/*
  Middleware de Autenticación
  TechRetail Solutions S.R.L.
  
  Verifica si el usuario está logueado
 */

// Middleware: verificar que el usuario esté logueado
const verificarSesion = (req, res, next) => {
  // Si hay sesión de usuario, continuar
  if (req.session.usuario) {
    return next();
  }

  // Si no hay sesión, redirigir a login
  res.redirect('/login');
};

// Middleware: verificar que sea admin
const verificarAdmin = (req, res, next) => {
  // Si no hay sesión, redirigir a login
  if (!req.session.usuario) {
    return res.redirect('/login');
  }

  // Si no es admin, redirigir a home
  if (req.session.usuario.rol !== 'admin') {
    return res.status(403).json({
      ok: false,
      mensaje: 'No tienes permisos para acceder'
    });
  }

  // Si es admin, continuar
  next();
};

module.exports = { 
  verificarSesion, 
  verificarAdmin 
};