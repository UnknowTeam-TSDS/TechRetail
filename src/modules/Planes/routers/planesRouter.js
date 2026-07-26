/*
    Router de Planes
    TechRetail Solutions S.R.L.
 */

const express = require('express');
const controller = require('../controllers/planesController');
const validarObjectId = require('../../../middlewares/validarObjectId');

const router = express.Router();

// Rutas para Vistas (PRIMERO - rutas específicas)
router.get('/vista', controller.vistaPlanes);          // GET  /planes/vista
router.post('/form', controller.crearPlanForm);        // POST /planes/form
router.post('/eliminar/:id', validarObjectId('id'), controller.eliminarPlanForm);

// Rutas API REST (DESPUÉS - rutas parametrizadas)
router.get('/', controller.listarPlanes);              // GET  /api/planes
router.post('/', controller.crearPlan);                // POST /api/planes
router.get('/:id', validarObjectId('id'), controller.obtenerPlan);            // GET  /api/planes/:id
router.put('/:id', validarObjectId('id'), controller.actualizarPlan);         // PUT  /api/planes/:id
router.delete('/:id', validarObjectId('id'), controller.eliminarPlan);        // DELETE /api/planes/:id

module.exports = router;