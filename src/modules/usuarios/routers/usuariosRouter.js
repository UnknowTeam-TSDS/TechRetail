/*
    Router de Usuarios
    TechRetail Solutions S.R.L.
 */

const express = require('express');
const controller = require('../controllers/usuariosController');

const router = express.Router();

// Rutas para Vistas (PRIMERO - rutas específicas)
router.get('/vista', controller.vistaUsuarios);        // GET  /usuarios/vista
router.post('/form', controller.crearUsuarioForm);     // POST /usuarios/form
router.post('/eliminar/:id', controller.eliminarUsuario);
router.post('/estado/:id', controller.cambiarEstado);     // POST /usuarios/estado/:id
router.post('/plan/:id', controller.cambiarPlan);         // POST /usuarios/plan/:id

// Rutas API REST (DESPUÉS - rutas parametrizadas)
router.get('/', controller.listarUsuarios);            // GET  /api/usuarios
router.post('/', controller.crearUsuario);             // POST /api/usuarios
router.get('/:id', controller.obtenerUsuario);         // GET  /api/usuarios/:id
router.put('/:id', controller.actualizarUsuario);      // PUT  /api/usuarios/:id
router.delete('/:id', controller.eliminarUsuario);     // DELETE /api/usuarios/:id

module.exports = router;