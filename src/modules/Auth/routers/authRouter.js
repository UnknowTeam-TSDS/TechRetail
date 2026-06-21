/*
  Router de Autenticación
  TechRetail Solutions S.R.L.
 */

const express = require('express');
const controller = require('../controllers/authController');

const router = express.Router();

// Rutas de autenticación
router.get('/login', controller.vistaLogin);              // GET  /login
router.post('/login', controller.loginUsuario);           // POST /login
router.post('/logout', controller.logout);                // POST /logout
router.get('/registro', controller.vistaRegistro);        // GET  /registro
router.post('/registro', controller.registrarUsuario);    // POST /registro

module.exports = router;