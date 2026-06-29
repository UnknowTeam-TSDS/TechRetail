const storage = require('../storage/tiendaStorage');
const productosStorage = require('../../Productos/storage/productosStorage');
const Usuario = require('../../usuarios/models/Usuario');

const emitirSocket = (req, evento, datos) => {
  const io = req.app?.get?.('io');
  if (io) io.emit(evento, datos);
};

const obtenerCarritoTienda = (req, tiendaId) => {
  const tiendaIdStr = String(tiendaId);

  if (!req.session.carrito || req.session.carrito.tiendaId !== tiendaIdStr) {
    req.session.carrito = { tiendaId: tiendaIdStr, items: [] };
  }

  return req.session.carrito;
};

const cantidadCarrito = (req, tiendaId) => {
  const carrito = req.session.carrito;
  if (!carrito || carrito.tiendaId !== String(tiendaId)) return 0;

  return carrito.items.reduce((sum, item) => sum + item.cantidad, 0);
};

const armarResumenCarrito = async (req, tienda) => {
  const carrito = obtenerCarritoTienda(req, tienda._id);
  const ids = carrito.items.map(item => item.productoId);
  const productos = ids.length
    ? await productosStorage.buscarActivosPorIds(tienda._id, ids)
    : [];
  const productosPorId = new Map(productos.map(producto => [String(producto._id), producto]));

  const items = [];
  let total = 0;

  carrito.items.forEach(item => {
    const producto = productosPorId.get(item.productoId);
    if (!producto) return;

    const maximo = producto.tipo === 'fisico' ? producto.stock : 99;
    const cantidad = Math.min(item.cantidad, maximo);
    if (cantidad <= 0) return;

    const precioUnitario = producto.precioPromocional || producto.precio;
    const subtotal = precioUnitario * cantidad;
    total += subtotal;
    items.push({ producto, cantidad, precioUnitario, subtotal });
  });

  carrito.items = items.map(item => ({
    productoId: String(item.producto._id),
    cantidad: item.cantidad,
  }));

  return {
    items,
    total,
    cantidadTotal: items.reduce((sum, item) => sum + item.cantidad, 0),
  };
};

const cargarTiendaActiva = async (id) => {
  const tienda = await storage.buscarPorId(id);
  if (!tienda || tienda.estado !== 'activa') return null;
  return tienda;
};

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

    const tiendaGuardada = await storage.guardarTienda(req.session.usuario.id, {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      rubro,
      estado: estadoFinal,
      emailContacto: emailContacto?.trim(),
      telefono: telefono?.trim(),
      direccion: direccion?.trim(),
      whatsapp: whatsapp?.trim() || '',
    });

    if (!tiendaActual) {
      emitirSocket(req, 'nueva-tienda', {
        nombre: tiendaGuardada.nombre,
        rubro: tiendaGuardada.rubro,
        usuario: req.session.usuario.nombre,
      });
    }

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

    const tiendaPublicada = await storage.actualizarEstado(req.session.usuario.id, 'activa');
    emitirSocket(req, 'tienda-publicada', {
      nombre: tiendaPublicada?.nombre || 'Tienda',
      usuario: req.session.usuario.nombre,
    });
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

    res.render('tienda-publica', {
      tienda,
      productos,
      categorias,
      previsualizando,
      carritoCantidad: cantidadCarrito(req, tienda._id),
    });
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

    res.render('producto-publico', {
      tienda,
      producto,
      previsualizando,
      carritoCantidad: cantidadCarrito(req, tienda._id),
    });
  } catch (error) {
    console.error('Error cargando producto público:', error.message);
    res.status(404).json({ ok: false, mensaje: 'Producto no encontrado.' });
  }
};

const vistaCarrito = async (req, res) => {
  try {
    const tienda = await cargarTiendaActiva(req.params.id);
    if (!tienda) {
      return res.status(404).json({ ok: false, mensaje: 'Tienda no encontrada.' });
    }

    const resumen = await armarResumenCarrito(req, tienda);
    res.render('carrito-publico', {
      tienda,
      items: resumen.items,
      total: resumen.total,
      cantidadTotal: resumen.cantidadTotal,
    });
  } catch (error) {
    console.error('Error cargando carrito:', error.message);
    res.redirect(`/tienda/${req.params.id}`);
  }
};

const agregarProductoCarrito = async (req, res) => {
  try {
    const tienda = await cargarTiendaActiva(req.params.id);
    if (!tienda) {
      return res.status(404).json({ ok: false, mensaje: 'Tienda no encontrada.' });
    }

    const producto = await productosStorage.buscarPublicoPorId(req.params.productoId, tienda._id);
    if (!producto) return res.redirect(`/tienda/${tienda._id}`);

    if (producto.tipo === 'fisico' && producto.stock <= 0) {
      return res.redirect(`/tienda/${tienda._id}/producto/${producto._id}`);
    }

    const cantidadSolicitada = Math.max(1, parseInt(req.body.cantidad, 10) || 1);
    const carrito = obtenerCarritoTienda(req, tienda._id);
    const productoId = String(producto._id);
    const itemActual = carrito.items.find(item => item.productoId === productoId);
    const cantidadActual = itemActual ? itemActual.cantidad : 0;
    const maximo = producto.tipo === 'fisico' ? producto.stock : 99;
    const cantidadFinal = Math.min(cantidadActual + cantidadSolicitada, maximo);

    if (itemActual) {
      itemActual.cantidad = cantidadFinal;
    } else {
      carrito.items.push({ productoId, cantidad: cantidadFinal });
    }

    res.redirect(`/tienda/${tienda._id}/carrito`);
  } catch (error) {
    console.error('Error agregando producto al carrito:', error.message);
    res.redirect(`/tienda/${req.params.id}`);
  }
};

const actualizarProductoCarrito = async (req, res) => {
  try {
    const tienda = await cargarTiendaActiva(req.params.id);
    if (!tienda) {
      return res.status(404).json({ ok: false, mensaje: 'Tienda no encontrada.' });
    }

    const carrito = obtenerCarritoTienda(req, tienda._id);
    const productoId = String(req.params.productoId);
    const cantidad = parseInt(req.body.cantidad, 10) || 0;

    if (cantidad <= 0) {
      carrito.items = carrito.items.filter(item => item.productoId !== productoId);
      return res.redirect(`/tienda/${tienda._id}/carrito`);
    }

    const producto = await productosStorage.buscarPublicoPorId(productoId, tienda._id);
    if (!producto) {
      carrito.items = carrito.items.filter(item => item.productoId !== productoId);
      return res.redirect(`/tienda/${tienda._id}/carrito`);
    }

    const maximo = producto.tipo === 'fisico' ? producto.stock : 99;
    const itemActual = carrito.items.find(item => item.productoId === productoId);
    if (itemActual) itemActual.cantidad = Math.min(cantidad, maximo);

    res.redirect(`/tienda/${tienda._id}/carrito`);
  } catch (error) {
    console.error('Error actualizando carrito:', error.message);
    res.redirect(`/tienda/${req.params.id}/carrito`);
  }
};

const quitarProductoCarrito = async (req, res) => {
  const carrito = obtenerCarritoTienda(req, req.params.id);
  carrito.items = carrito.items.filter(item => item.productoId !== String(req.params.productoId));
  res.redirect(`/tienda/${req.params.id}/carrito`);
};

const vaciarCarrito = async (req, res) => {
  if (req.session.carrito?.tiendaId === String(req.params.id)) {
    req.session.carrito = { tiendaId: String(req.params.id), items: [] };
  }
  res.redirect(`/tienda/${req.params.id}/carrito`);
};

module.exports = {
  vistaTienda,
  vistaEditarTienda,
  guardarTienda,
  publicarTienda,
  despublicarTienda,
  vistaPublicaTienda,
  vistaPublicaProducto,
  vistaCarrito,
  agregarProductoCarrito,
  actualizarProductoCarrito,
  quitarProductoCarrito,
  vaciarCarrito,
};
