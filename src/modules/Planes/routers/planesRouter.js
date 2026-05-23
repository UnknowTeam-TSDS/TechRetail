/*
    Router de Planes
    TechRetail Solutions S.R.L.
 */

const express = require('express');
const controller = require('../controllers/planesController');

const router = express.Router();

// Rutas para Vistas (PRIMERO - rutas específicas)
router.get('/vista', controller.vistaPlanes);          // GET  /planes/vista
router.post('/form', controller.crearPlanForm);        // POST /planes/form
router.post('/eliminar/:id', controller.eliminarPlan); // POST /planes/eliminar/:id ← AGREGAR ESTA LÍNEA

// Rutas API REST (DESPUÉS - rutas parametrizadas)
router.get('/', controller.listarPlanes);              // GET  /api/planes
router.post('/', controller.crearPlan);                // POST /api/planes
router.get('/:id', controller.obtenerPlan);            // GET  /api/planes/:id
router.put('/:id', controller.actualizarPlan);         // PUT  /api/planes/:id
router.delete('/:id', controller.eliminarPlan);        // DELETE /api/planes/:id

module.exports = router;