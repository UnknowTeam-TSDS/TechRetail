const express = require('express');
const router = express.Router();
const controller = require('../controllers/finanzasController');

// Se monta bajo /finanzas con verificarAdmin desde app.js.
router.get('/', controller.vistaFinanzas);

module.exports = router;
