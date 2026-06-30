const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiendaController');
const { verificarSesion } = require('../../../middlewares/autenticacion');
const validarObjectId = require('../../../middlewares/validarObjectId');

router.get('/mi-tienda', verificarSesion, controller.vistaTienda);
router.get('/mi-tienda/editar', verificarSesion, controller.vistaEditarTienda);
router.post('/mi-tienda', verificarSesion, controller.guardarTienda);
router.post('/mi-tienda/publicar', verificarSesion, controller.publicarTienda);
router.post('/mi-tienda/despublicar', verificarSesion, controller.despublicarTienda);
router.post('/mi-tienda/medios-pago', verificarSesion, controller.guardarMediosPago);
router.post('/mi-tienda/medios-envio', verificarSesion, controller.guardarMediosEnvio);
router.get('/tienda/:id/carrito', validarObjectId('id'), controller.vistaCarrito);
router.post('/tienda/:id/carrito/agregar/:productoId', controller.agregarProductoCarrito);
router.post('/tienda/:id/carrito/actualizar/:productoId', controller.actualizarProductoCarrito);
router.post('/tienda/:id/carrito/quitar/:productoId', controller.quitarProductoCarrito);
router.post('/tienda/:id/carrito/vaciar', controller.vaciarCarrito);
router.get('/tienda/:id', validarObjectId('id'), controller.vistaPublicaTienda);
router.get('/tienda/:id/producto/:productoId', validarObjectId('id'), controller.vistaPublicaProducto);

module.exports = router;
