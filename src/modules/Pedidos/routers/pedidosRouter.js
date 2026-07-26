const express = require('express');
const router = express.Router();
const controller = require('../controllers/pedidosController');
const { verificarSesion } = require('../../../middlewares/autenticacion');
const validarObjectId = require('../../../middlewares/validarObjectId');

// Checkout y confirmación: públicos (el comprador no necesita cuenta).
router.post('/tienda/:id/checkout', validarObjectId('id'), controller.procesarCheckout);
router.get('/tienda/:id/pedido/:pedidoId', validarObjectId('id'), validarObjectId('pedidoId'), controller.vistaConfirmacion);

// Panel del dueño: requiere sesión de cliente.
router.get('/mis-pedidos', verificarSesion, controller.vistaMisPedidos);
router.post('/mis-pedidos/:id/estado', verificarSesion, validarObjectId('id'), controller.cambiarEstadoPedido);

module.exports = router;
