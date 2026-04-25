/**
 * Router de Usuarios
 * TechRetail Solutions S.R.L.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');

// Vista HTML (motor Pug)
router.get('/vista', ctrl.vistaUsuarios);

// Rutas de formulario HTML — usan POST y redirigen (patrón PRG)
// Deben ir ANTES de las rutas con /:id para que Express no las confunda con un parámetro
router.post('/eliminar/:id', ctrl.eliminarUsuario);
router.post('/form', ctrl.crearUsuarioForm);

// Ruta de registro nuevo usario
router.post('/', ctrl.crearUsuario);

// Ruta de listado de usuarios
router.get('/', ctrl.listarUsuarios);

// Rutas dinámicas con parámetro :id
router.get('/:id', ctrl.obtenerUsuario);
router.put('/:id', ctrl.actualizarUsuario);
router.delete('/:id', ctrl.eliminarUsuario);

module.exports = router;
