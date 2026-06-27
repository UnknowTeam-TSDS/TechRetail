const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiendaController');
const { verificarSesion } = require('../../../middlewares/autenticacion');

router.get('/mi-tienda', verificarSesion, controller.vistaTienda);
router.get('/mi-tienda/editar', verificarSesion, controller.vistaEditarTienda);
router.post('/mi-tienda', verificarSesion, controller.guardarTienda);
router.post('/mi-tienda/publicar', verificarSesion, controller.publicarTienda);
router.post('/mi-tienda/despublicar', verificarSesion, controller.despublicarTienda);
router.get('/tienda/:id', controller.vistaPublicaTienda);
router.get('/tienda/:id/producto/:productoId', controller.vistaPublicaProducto);

module.exports = router;
