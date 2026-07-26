/*
    Router de Usuarios
    TechRetail Solutions S.R.L.
 */

const express = require('express');
const controller = require('../controllers/usuariosController');
const validarObjectId = require('../../../middlewares/validarObjectId');

const router = express.Router();

// Rutas para Vistas (PRIMERO - rutas específicas)
router.get('/vista', controller.vistaUsuarios);        // GET  /usuarios/vista
router.post('/form', controller.crearUsuarioForm);     // POST /usuarios/form
router.post('/eliminar/:id', validarObjectId('id'), controller.eliminarUsuarioForm);
router.post('/estado/:id', validarObjectId('id'), controller.cambiarEstado);     // POST /usuarios/estado/:id

// Rutas API REST (DESPUÉS - rutas parametrizadas)
router.get('/', controller.listarUsuarios);            // GET  /api/usuarios
router.post('/', controller.crearUsuario);             // POST /api/usuarios
router.get('/:id', validarObjectId('id'), controller.obtenerUsuario);         // GET  /api/usuarios/:id
router.put('/:id', validarObjectId('id'), controller.actualizarUsuario);      // PUT  /api/usuarios/:id
router.delete('/:id', validarObjectId('id'), controller.eliminarUsuario);     // DELETE /api/usuarios/:id

module.exports = router;