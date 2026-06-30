const mongoose = require('mongoose');

// Valida que un parámetro de ruta sea un ObjectId de Mongo válido.
// Evita errores feos (CastError → 500) cuando llega un :id malformado en la URL
// y devuelve una página 404 con estilo en su lugar.
const validarObjectId = (param = 'id') => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) {
    return res.status(404).render('error', {
      codigo: 404,
      titulo: 'Enlace inválido',
      mensaje: 'El enlace que seguiste no es válido o está incompleto.',
      volverHref: '/',
      volverTexto: 'Ir al inicio',
    });
  }
  next();
};

module.exports = validarObjectId;
