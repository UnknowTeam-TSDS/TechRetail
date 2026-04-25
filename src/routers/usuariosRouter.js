/**
 Router de Usuarios
 TechRetail Solutions S.R.L.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');

// Vista HTML
router.get('/vista', ctrl.vistaUsuarios);

// Rutas dinámicas con parámetro :id
router.post('/eliminar/:id', ctrl.eliminarUsuario);
router.post('/form', ctrl.crearUsuarioForm);
router.post('/', ctrl.crearUsuario);
router.get('/', ctrl.listarUsuarios);
router.get('/:id', ctrl.obtenerUsuario);
router.put('/:id', ctrl.actualizarUsuario);
router.delete('/:id', ctrl.eliminarUsuario);

module.exports = router;
