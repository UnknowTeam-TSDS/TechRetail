const express = require('express');
const router = express.Router();
const controller = require('../controllers/productosController');
const { verificarSesion } = require('../../../middlewares/autenticacion');
const upload = require('../../../config/multer');
const validarObjectId = require('../../../middlewares/validarObjectId');

router.get('/mis-productos', verificarSesion, controller.vistaProductos);
router.post('/mis-productos/form', verificarSesion, upload.array('imagenes', 5), controller.crearProducto);
router.get('/mis-productos/editar/:id', verificarSesion, validarObjectId('id'), controller.vistaEditarProducto);
router.post('/mis-productos/editar/:id', verificarSesion, validarObjectId('id'), upload.array('imagenes', 5), controller.actualizarProducto);
router.post('/mis-productos/eliminar/:id', verificarSesion, validarObjectId('id'), controller.eliminarProducto);
router.post('/mis-productos/estado/:id', verificarSesion, validarObjectId('id'), controller.cambiarEstadoProducto);

module.exports = router;
