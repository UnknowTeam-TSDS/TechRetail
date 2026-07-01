const storage = require('../storage/tiendaStorage');
const productosStorage = require('../../Productos/storage/productosStorage');
const Usuario = require('../../usuarios/models/Usuario');
const { MEDIOS_PAGO, MEDIOS_ENVIO, PAGO_IDS, ENVIO_IDS, resolver } = require('../opcionesComerciales');

const { emitirSocket, flash, render404 } = require('../../../utils/helpers');

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

const esDuenoTienda = (req, tienda) => {
  return !!(req.session?.usuario && String(req.session.usuario.id) === String(tienda.usuarioId));
};

const cargarTiendaComprable = async (req, id) => {
  const tienda = await storage.buscarPorId(id);
  if (!tienda) return null;

  const esDueno = esDuenoTienda(req, tienda);
  if (tienda.estado !== 'activa' && !esDueno) return null;

  return {
    tienda,
    previsualizando: esDueno && tienda.estado !== 'activa',
  };
};

// GET /mi-tienda — panel guiado de onboarding de la tienda
const vistaTienda = async (req, res) => {
  try {
    const [tienda, usuario] = await Promise.all([
      storage.buscarPorUsuario(req.session.usuario.id),
      Usuario.findById(req.session.usuario.id),
    ]);

    const enTrial = !!(usuario.trialHasta && new Date(usuario.trialHasta) > new Date());
    const planPago = !!(usuario.planId) && !enTrial;
    // Para publicar alcanza con tener un plan elegido (incluido Starter en prueba).
    const puedePublicar = !!(usuario.planId);

    // Cantidad de productos cargados: habilita el paso "Cargá tu primer producto".
    const cantidadProductos = tienda
      ? (await productosStorage.contarPorTienda(tienda._id)) || 0
      : 0;

    // Estado de cada paso del onboarding guiado. La vista los muestra como
    // checklist y desbloquea cada paso a medida que se completa el anterior.
    const estados = {
      crear: !!tienda,
      productos: cantidadProductos > 0,
      pago: !!(tienda && tienda.mediosPago && tienda.mediosPago.length > 0),
      envio: !!(tienda && tienda.mediosEnvio && tienda.mediosEnvio.length > 0),
      publicar: !!(tienda && tienda.estado === 'activa'),
    };
    const completados = Object.values(estados).filter(Boolean).length;
    const total = Object.keys(estados).length;

    res.render('mi-tienda', {
      titulo: 'Mi tienda',
      usuario: req.session.usuario,
      tienda,
      enTrial,
      planPago,
      puedePublicar,
      estados,
      progreso: { completados, total, porcentaje: Math.round((completados / total) * 100) },
      mediosPagoCatalogo: MEDIOS_PAGO,
      mediosEnvioCatalogo: MEDIOS_ENVIO,
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
    const puedePublicar = !!(usuario.planId);

    res.render('mi-tienda-editar', {
      titulo: tienda ? 'Editar tienda' : 'Crear tienda',
      usuario: req.session.usuario,
      tienda,
      enTrial,
      planPago,
      puedePublicar,
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
    const tienePlan = !!(usuario.planId);

    // El estado se conserva (no se edita acá); una tienda nueva arranca en construcción.
    // Si estuviera publicada sin un plan elegido, se vuelve a construcción (guard defensivo).
    let estadoFinal = tiendaActual ? tiendaActual.estado : 'en_construccion';
    if (!tienePlan && estadoFinal === 'activa') estadoFinal = 'en_construccion';

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

    flash(req, 'ok', tiendaActual ? 'Datos de la tienda actualizados.' : '¡Tienda creada! Seguí con los próximos pasos.');
    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error guardando tienda:', error.message);
    flash(req, 'error', 'No pudimos guardar la tienda. Revisá los datos e intentá de nuevo.');
    res.redirect('/mi-tienda/editar');
  }
};

// POST /mi-tienda/publicar — pone la tienda activa (requiere un plan elegido, trial incluido)
const publicarTienda = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.session.usuario.id);
    const tienePlan = !!(usuario.planId);
    if (!tienePlan) {
      flash(req, 'error', 'Elegí un plan (aunque sea la prueba gratuita) para publicar tu tienda.');
      return res.redirect('/mi-tienda');
    }

    const tiendaPublicada = await storage.actualizarEstado(req.session.usuario.id, 'activa');
    emitirSocket(req, 'tienda-publicada', {
      nombre: tiendaPublicada?.nombre || 'Tienda',
      usuario: req.session.usuario.nombre,
    });
    flash(req, 'ok', '¡Tu tienda está publicada y online!');
    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error al publicar tienda:', error.message);
    flash(req, 'error', 'No pudimos publicar la tienda. Intentá de nuevo.');
    res.redirect('/mi-tienda');
  }
};

// POST /mi-tienda/despublicar — saca la tienda de publicación
const despublicarTienda = async (req, res) => {
  try {
    await storage.actualizarEstado(req.session.usuario.id, 'inactiva');
    flash(req, 'ok', 'Tu tienda dejó de estar publicada.');
    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error al despublicar tienda:', error.message);
    res.redirect('/mi-tienda');
  }
};

// POST /mi-tienda/medios-pago — guarda los medios de pago elegidos (simulados)
const guardarMediosPago = async (req, res) => {
  try {
    // Los checkboxes llegan como string (uno), array (varios) o undefined (ninguno).
    // Normalizamos a array y filtramos contra el catálogo para descartar valores inválidos.
    const seleccion = [].concat(req.body.medios || []);
    const validos = seleccion.filter((id) => PAGO_IDS.includes(id));
    await storage.actualizarMediosPago(req.session.usuario.id, validos);
    flash(req, 'ok', 'Medios de pago actualizados.');
    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error guardando medios de pago:', error.message);
    flash(req, 'error', 'No pudimos guardar los medios de pago.');
    res.redirect('/mi-tienda');
  }
};

// POST /mi-tienda/medios-envio — guarda los medios de envío y el monto de envío gratis
const guardarMediosEnvio = async (req, res) => {
  try {
    const seleccion = [].concat(req.body.medios || []);
    const validos = seleccion.filter((id) => ENVIO_IDS.includes(id));

    // El monto de envío gratis solo se guarda si es un número positivo.
    const monto = parseFloat(req.body.envioGratisMonto);
    const envioGratisMonto = Number.isFinite(monto) && monto > 0 ? monto : null;

    await storage.actualizarMediosEnvio(req.session.usuario.id, validos, envioGratisMonto);
    flash(req, 'ok', 'Medios de envío actualizados.');
    res.redirect('/mi-tienda');
  } catch (error) {
    console.error('Error guardando medios de envío:', error.message);
    flash(req, 'error', 'No pudimos guardar los medios de envío.');
    res.redirect('/mi-tienda');
  }
};

// GET /tienda/:id — pública, sin login. El dueño puede previsualizarla aunque no esté activa.
const vistaPublicaTienda = async (req, res) => {
  try {
    const tienda = await storage.buscarPorId(req.params.id);

    if (!tienda) {
      return render404(res, 'Esta tienda no está disponible.');
    }

    const esDueno = !!(req.session.usuario && String(req.session.usuario.id) === String(tienda.usuarioId));

    // Una tienda inactiva solo es visible para su dueño (en modo previsualización)
    if (tienda.estado === 'inactiva' && !esDueno) {
      return render404(res, 'Esta tienda no está disponible.');
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
    render404(res, 'Esta tienda no está disponible.');
  }
};

// GET /tienda/:id/producto/:productoId — pública, sin login. El dueño puede previsualizarla.
const vistaPublicaProducto = async (req, res) => {
  try {
    const tienda = await storage.buscarPorId(req.params.id);

    if (!tienda) {
      return render404(res, 'Este producto no está disponible.');
    }

    const esDueno = !!(req.session.usuario && String(req.session.usuario.id) === String(tienda.usuarioId));

    // La tienda debe estar activa, salvo que el dueño esté previsualizando
    if (tienda.estado !== 'activa' && !esDueno) {
      return render404(res, 'Este producto no está disponible.');
    }

    const producto = await productosStorage.buscarPublicoPorId(req.params.productoId, tienda._id);

    if (!producto) {
      return render404(res, 'Este producto no está disponible.');
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
    render404(res, 'Este producto no está disponible.');
  }
};

const vistaCarrito = async (req, res) => {
  try {
    const resultado = await cargarTiendaComprable(req, req.params.id);
    if (!resultado) {
      return render404(res, 'Esta tienda no está disponible.');
    }

    const { tienda, previsualizando } = resultado;
    const resumen = await armarResumenCarrito(req, tienda);
    res.render('carrito-publico', {
      tienda,
      items: resumen.items,
      total: resumen.total,
      cantidadTotal: resumen.cantidadTotal,
      previsualizando,
      // Medios configurados por el dueño, resueltos a sus datos completos.
      mediosPago: resolver(MEDIOS_PAGO, tienda.mediosPago),
      mediosEnvio: resolver(MEDIOS_ENVIO, tienda.mediosEnvio),
      envioGratisMonto: tienda.envioGratisMonto || null,
    });
  } catch (error) {
    console.error('Error cargando carrito:', error.message);
    res.redirect(`/tienda/${req.params.id}`);
  }
};

const agregarProductoCarrito = async (req, res) => {
  try {
    const resultado = await cargarTiendaComprable(req, req.params.id);
    if (!resultado) {
      return render404(res, 'Esta tienda no está disponible.');
    }

    const { tienda } = resultado;
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
    const resultado = await cargarTiendaComprable(req, req.params.id);
    if (!resultado) {
      return render404(res, 'Esta tienda no está disponible.');
    }

    const { tienda } = resultado;
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
  const resultado = await cargarTiendaComprable(req, req.params.id);
  if (!resultado) return render404(res, 'Esta tienda no está disponible.');

  const carrito = obtenerCarritoTienda(req, resultado.tienda._id);
  carrito.items = carrito.items.filter(item => item.productoId !== String(req.params.productoId));
  res.redirect(`/tienda/${resultado.tienda._id}/carrito`);
};

const vaciarCarrito = async (req, res) => {
  const resultado = await cargarTiendaComprable(req, req.params.id);
  if (!resultado) return render404(res, 'Esta tienda no está disponible.');

  const tiendaId = String(resultado.tienda._id);
  if (req.session.carrito?.tiendaId === tiendaId) {
    req.session.carrito = { tiendaId, items: [] };
  }
  res.redirect(`/tienda/${tiendaId}/carrito`);
};

module.exports = {
  vistaTienda,
  vistaEditarTienda,
  guardarTienda,
  publicarTienda,
  despublicarTienda,
  guardarMediosPago,
  guardarMediosEnvio,
  vistaPublicaTienda,
  vistaPublicaProducto,
  vistaCarrito,
  agregarProductoCarrito,
  actualizarProductoCarrito,
  quitarProductoCarrito,
  vaciarCarrito,
};
