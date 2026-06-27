const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiendaController');
const { verificarSesion } = require('../../../middlewares/autenticacion');

router.get('/mi-tienda', verificarSesion, controller.vistaTienda);
router.post('/mi-tienda', verificarSesion, controller.guardarTienda);
router.get('/tienda/:id', controller.vistaPublicaTienda);

module.exports = router;
