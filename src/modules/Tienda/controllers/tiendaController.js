const storage = require('../storage/tiendaStorage');
const productosStorage = require('../../Productos/storage/productosStorage');
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
    const { nombre, descripcion, rubro, estado,
      emailContacto, telefono, direccion, whatsapp } = req.body;

    const usuario = await Usuario.findById(req.session.usuario.id);
    const enTrial = !!(usuario.trialHasta && new Date(usuario.trialHasta) > new Date());

    const estadoFinal = enTrial ? 'en_construccion' : (estado || 'en_construccion');

    await storage.guardarTienda(req.session.usuario.id, {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      rubro,
      estado: estadoFinal,
      emailContacto: emailContacto?.trim(),
      telefono: telefono?.trim(),
      direccion: direccion?.trim(),
      whatsapp: whatsapp?.trim() || '',
    });

    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error guardando tienda:', error.message);
    res.redirect('/mi-tienda');
  }
};

// GET /tienda/:id — pública, sin login. El dueño puede previsualizarla aunque no esté activa.
const vistaPublicaTienda = async (req, res) => {
  try {
    const tienda = await storage.buscarPorId(req.params.id);

    if (!tienda) {
      return res.status(404).json({ ok: false, mensaje: 'Tienda no encontrada.' });
    }

    const esDueno = !!(req.session.usuario && String(req.session.usuario.id) === String(tienda.usuarioId));

    // Una tienda inactiva solo es visible para su dueño (en modo previsualización)
    if (tienda.estado === 'inactiva' && !esDueno) {
      return res.status(404).json({ ok: false, mensaje: 'Tienda no encontrada.' });
    }

    // Se muestra el catálogo si está activa, o si el dueño está previsualizando
    const mostrarCatalogo = tienda.estado === 'activa' || esDueno;
    const productos = mostrarCatalogo
      ? await productosStorage.listarActivosPorTienda(tienda._id)
      : [];

    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();
    const previsualizando = esDueno && tienda.estado !== 'activa';

    res.render('tienda-publica', { tienda, productos, categorias, previsualizando });
  } catch (error) {
    console.error('Error cargando tienda pública:', error.message);
    res.status(404).json({ ok: false, mensaje: 'Tienda no encontrada.' });
  }
};

// GET /tienda/:id/producto/:productoId — pública, sin login
const vistaPublicaProducto = async (req, res) => {
  try {
    const tienda = await storage.buscarPorId(req.params.id);

    if (!tienda || tienda.estado !== 'activa') {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    const producto = await productosStorage.buscarPublicoPorId(req.params.productoId, tienda._id);

    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    res.render('producto-publico', { tienda, producto });
  } catch (error) {
    console.error('Error cargando producto público:', error.message);
    res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
  }
};

module.exports = { vistaTienda, guardarTienda, vistaPublicaTienda, vistaPublicaProducto };
