const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/planesController');

router.get('/vista', ctrl.vistaPlanes);
router.post('/eliminar/:id', ctrl.eliminarPlan);
router.post('/form', ctrl.crearPlanForm);
router.post('/', ctrl.crearPlan);
router.get('/', ctrl.listarPlanes);
router.get('/:id', ctrl.obtenerPlan);
router.put('/:id', ctrl.actualizarPlan);
router.delete('/:id', ctrl.eliminarPlan);

module.exports = router;