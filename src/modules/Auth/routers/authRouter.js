/*
  Router de Autenticación
  TechRetail Solutions S.R.L.
*/

const express = require('express');
const controller = require('../controllers/authController');
const { verificarSesion } = require('../../../middlewares/autenticacion');

const router = express.Router();

router.get('/login', controller.vistaLogin);
router.post('/login', controller.loginUsuario);
router.post('/logout', controller.logout);
router.get('/registro', controller.vistaRegistro);
router.post('/registro', controller.registrarUsuario);

// Rutas del cliente (requieren sesión, no requieren ser admin)
router.get('/elegir-plan', verificarSesion, controller.vistaElegirPlan);
router.post('/elegir-plan', verificarSesion, controller.seleccionarPlan);
router.get('/mi-cuenta', verificarSesion, controller.vistaCliente);
router.get('/cambiar-contrasena', verificarSesion, controller.vistaCambiarContrasena);
router.post('/cambiar-contrasena', verificarSesion, controller.actualizarContrasena);

module.exports = router;
