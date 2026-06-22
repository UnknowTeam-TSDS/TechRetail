const express = require('express');
const router = express.Router();
const controller = require('../controllers/productosController');
const { verificarSesion } = require('../../../middlewares/autenticacion');

router.get('/mis-productos', verificarSesion, controller.vistaProductos);
router.post('/mis-productos/form', verificarSesion, controller.crearProducto);
router.post('/mis-productos/eliminar/:id', verificarSesion, controller.eliminarProducto);
router.post('/mis-productos/estado/:id', verificarSesion, controller.cambiarEstadoProducto);

module.exports = router;
