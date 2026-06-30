const express = require('express');
const router = express.Router();
const controller = require('../controllers/pedidosController');
const { verificarSesion } = require('../../../middlewares/autenticacion');

// Checkout y confirmación: públicos (el comprador no necesita cuenta).
router.post('/tienda/:id/checkout', controller.procesarCheckout);
router.get('/tienda/:id/pedido/:pedidoId', controller.vistaConfirmacion);

// Panel del dueño: requiere sesión de cliente.
router.get('/mis-pedidos', verificarSesion, controller.vistaMisPedidos);

module.exports = router;
