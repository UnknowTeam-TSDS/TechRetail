const storage = require('../storage/tiendaStorage');
const Usuario = require('../../usuarios/models/Usuario');

// GET /mi-tienda
const vistaTienda = async (req, res) => {
  try {
    const [tienda, usuario] = await Promise.all([
      storage.buscarPorUsuario(req.session.usuario.id),
      Usuario.findById(req.session.usuario.id),
    ]);

    const enTrial = !!(usuario.trialHasta && new Date(usuario.trialHasta) > new Date());
    const planPago = !!(usuario.planId) && !enTrial;

    res.render('mi-tienda', {
      titulo: 'Mi tienda',
      usuario: req.session.usuario,
      tienda,
      enTrial,
      planPago,
    });
  } catch (error) {
    console.error('Error cargando mi tienda:', error.message);
    res.redirect('/mi-cuenta');
  }
};

// POST /mi-tienda
const guardarTienda = async (req, res) => {
  try {
    const { nombre, descripcion, rubro, colorPrimario, estado } = req.body;

    const usuario = await Usuario.findById(req.session.usuario.id);
    const enTrial = !!(usuario.trialHasta && new Date(usuario.trialHasta) > new Date());

    const estadoFinal = enTrial ? 'en_construccion' : (estado || 'en_construccion');

    await storage.guardarTienda(req.session.usuario.id, {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      rubro,
      colorPrimario: colorPrimario || '#1D4ED8',
      estado: estadoFinal,
    });

    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error guardando tienda:', error.message);
    res.redirect('/mi-tienda');
  }
};

module.exports = { vistaTienda, guardarTienda };
