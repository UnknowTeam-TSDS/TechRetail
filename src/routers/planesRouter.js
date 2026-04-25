/*
 Router de Planes
 TechRetail Solutions S.R.L.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/planesController');

// Vista HTML (motor Pug)
router.get('/vista', ctrl.vistaPlanes);

// Rutas de formulario HTML — usan POST y redirigen (patrón PRG)
// Deben ir ANTES de las rutas con /:id para que Express no las confunda con un parámetro

router.post('/eliminar/:id', ctrl.eliminarPlan);
router.post('/form', ctrl.crearPlanForm);

// Ruta para creacion de nuevo plan
router.post('/', ctrl.crearPlan);

// Ruta de listado de planes y add-ons disponibles
router.get('/', ctrl.listarPlanes);

// Rutas dinámicas con parámetro :id
router.get('/:id', ctrl.obtenerPlan);
router.put('/:id', ctrl.actualizarPlan);
router.delete('/:id', ctrl.eliminarPlan);

module.exports = router;
