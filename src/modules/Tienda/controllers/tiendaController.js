const storage = require('../storage/tiendaStorage');
const productosStorage = require('../../Productos/storage/productosStorage');
const Usuario = require('../../usuarios/models/Usuario');

// GET /mi-tienda — panel resumen de la tienda
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

// GET /mi-tienda/editar — formulario de creación/edición
const vistaEditarTienda = async (req, res) => {
  try {
    const [tienda, usuario] = await Promise.all([
      storage.buscarPorUsuario(req.session.usuario.id),
      Usuario.findById(req.session.usuario.id),
    ]);

    const enTrial = !!(usuario.trialHasta && new Date(usuario.trialHasta) > new Date());
    const planPago = !!(usuario.planId) && !enTrial;

    res.render('mi-tienda-editar', {
      titulo: tienda ? 'Editar tienda' : 'Crear tienda',
      usuario: req.session.usuario,
      tienda,
      enTrial,
      planPago,
    });
  } catch (error) {
    console.error('Error cargando edición de tienda:', error.message);
    res.redirect('/mi-tienda');
  }
};

// POST /mi-tienda — guarda los datos. La visibilidad (publicar) se maneja aparte.
const guardarTienda = async (req, res) => {
  try {
    const { nombre, descripcion, rubro,
      emailContacto, telefono, direccion, whatsapp } = req.body;

    const [usuario, tiendaActual] = await Promise.all([
      Usuario.findById(req.session.usuario.id),
      storage.buscarPorUsuario(req.session.usuario.id),
    ]);
    const enTrial = !!(usuario.trialHasta && new Date(usuario.trialHasta) > new Date());

    // El estado se conserva (no se edita acá); una tienda nueva arranca en construcción.
    // Si por algún motivo está publicada estando en trial, se vuelve a construcción.
    let estadoFinal = tiendaActual ? tiendaActual.estado : 'en_construccion';
    if (enTrial && estadoFinal === 'activa') estadoFinal = 'en_construccion';

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
    res.redirect('/mi-tienda/editar');
  }
};

// POST /mi-tienda/publicar — pone la tienda activa (requiere plan pago, sin trial)
const publicarTienda = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id);
    const enTrial = !!(usuario.trialHasta && new Date(usuario.trialHasta) > new Date());
    const planPago = !!(usuario.planId) && !enTrial;
    if (!planPago) return res.redirect('/mi-tienda');

    await storage.actualizarEstado(req.session.usuario.id, 'activa');
    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error al publicar tienda:', error.message);
    res.redirect('/mi-tienda');
  }
};

// POST /mi-tienda/despublicar — saca la tienda de publicación
const despublicarTienda = async (req, res) => {
  try {
    await storage.actualizarEstado(req.session.usuario.id, 'inactiva');
    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error al despublicar tienda:', error.message);
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

// GET /tienda/:id/producto/:productoId — pública, sin login. El dueño puede previsualizarla.
const vistaPublicaProducto = async (req, res) => {
  try {
    const tienda = await storage.buscarPorId(req.params.id);

    if (!tienda) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    const esDueno = !!(req.session.usuario && String(req.session.usuario.id) === String(tienda.usuarioId));

    // La tienda debe estar activa, salvo que el dueño esté previsualizando
    if (tienda.estado !== 'activa' && !esDueno) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    const producto = await productosStorage.buscarPublicoPorId(req.params.productoId, tienda._id);

    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
    }

    const previsualizando = esDueno && tienda.estado !== 'activa';

    res.render('producto-publico', { tienda, producto, previsualizando });
  } catch (error) {
    console.error('Error cargando producto público:', error.message);
    res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
  }
};

module.exports = { vistaTienda, vistaEditarTienda, guardarTienda, publicarTienda, despublicarTienda, vistaPublicaTienda, vistaPublicaProducto };
