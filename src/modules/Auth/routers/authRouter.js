/*
  Router de Autenticación
  TechRetail Solutions S.R.L.
*/

const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const { verificarSesion } = require('../../../middlewares/autenticacion');

const router = express.Router();

// Limita los intentos de login por IP para frenar ataques de fuerza bruta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 10,                  // máximo 10 intentos por IP en esa ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiados intentos de inicio de sesión. Esperá unos minutos y volvé a intentar.',
});

router.get('/login', controller.vistaLogin);
router.post('/login', loginLimiter, controller.loginUsuario);
router.post('/logout', controller.logout);
router.get('/registro', controller.vistaRegistro);
router.post('/registro', controller.registrarUsuario);

// Rutas del cliente (requieren sesión, no requieren ser admin)
router.get('/elegir-plan', verificarSesion, controller.vistaElegirPlan);
router.post('/elegir-plan', verificarSesion, controller.seleccionarPlan);
router.get('/mi-cuenta', verificarSesion, controller.vistaCliente);
router.post('/mis-addons/agregar', verificarSesion, controller.agregarAddon);
router.post('/mis-addons/quitar', verificarSesion, controller.quitarAddon);
router.get('/cambiar-contrasena', verificarSesion, controller.vistaCambiarContrasena);
router.post('/cambiar-contrasena', verificarSesion, controller.actualizarContrasena);

module.exports = router;
