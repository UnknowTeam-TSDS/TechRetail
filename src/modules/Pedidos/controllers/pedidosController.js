const storage = require('../storage/pedidosStorage');
const tiendaStorage = require('../../Tienda/storage/tiendaStorage');
const productosStorage = require('../../Productos/storage/productosStorage');
const { MEDIOS_PAGO, MEDIOS_ENVIO, resolver } = require('../../Tienda/opcionesComerciales');

const { emitirSocket, flash, render404 } = require('../../../utils/helpers');

// El dueño puede operar su tienda aunque no esté publicada (modo previsualización).
const puedeComprar = (req, tienda) => {
  const esDueno = !!(req.session?.usuario && String(req.session.usuario.id) === String(tienda.usuarioId));
  return tienda.estado === 'activa' || esDueno;
};

// Arma los items del pedido desde el carrito en sesión, respetando stock y precio actual.
const armarItems = async (carrito, tiendaId) => {
  const ids = carrito.items.map((item) => item.productoId);
  const productos = ids.length ? await productosStorage.buscarActivosPorIds(tiendaId, ids) : [];
  const porId = new Map(productos.map((p) => [String(p._id), p]));

  const items = [];
  const stockItems = [];
  let total = 0;

  carrito.items.forEach((item) => {
    const producto = porId.get(item.productoId);
    if (!producto) return;

    const maximo = producto.tipo === 'fisico' ? producto.stock : 99;
    const cantidad = Math.min(item.cantidad, maximo);
    if (cantidad <= 0) return;

    const precioUnitario = producto.precioPromocional ?? producto.precio;
    const subtotal = precioUnitario * cantidad;
    total += subtotal;
    items.push({ productoId: producto._id, nombre: producto.nombre, precioUnitario, cantidad, subtotal });
    if (producto.tipo === 'fisico') {
      stockItems.push({ productoId: producto._id, cantidad });
    }
  });

  return { items, stockItems, total };
};

// POST /tienda/:id/checkout — crea un pedido simulado a partir del carrito
const procesarCheckout = async (req, res) => {
  const reservas = [];
  let pedidoCreado = false;
  let tiendaReserva = null;

  try {
    const tienda = await tiendaStorage.buscarPorId(req.params.id);
    if (!tienda || !puedeComprar(req, tienda)) {
      return render404(res, 'Esta tienda no está disponible.');
    }

    const carrito = req.session.carrito;
    const carritoValido = carrito && carrito.tiendaId === String(tienda._id) && carrito.items.length > 0;
    if (!carritoValido) return res.redirect(`/tienda/${tienda._id}/carrito`);

    const { items, stockItems, total } = await armarItems(carrito, tienda._id);
    if (items.length === 0) return res.redirect(`/tienda/${tienda._id}/carrito`);

    // El medio de pago debe ser uno de los que el dueño habilitó.
    const mediosPago = tienda.mediosPago || [];
    const mediosEnvio = tienda.mediosEnvio || [];
    const medioPago = mediosPago.includes(req.body.medioPago) ? req.body.medioPago : null;
    if (!medioPago) {
      flash(req, 'error', 'Elegí un medio de pago válido para finalizar la compra.');
      return res.redirect(`/tienda/${tienda._id}/carrito`);
    }
    const medioEnvio = mediosEnvio.includes(req.body.medioEnvio) ? req.body.medioEnvio : null;

    // Reservamos stock antes de crear el pedido. Si algún producto cambió de
    // disponibilidad, revertimos las reservas anteriores y volvemos al carrito.
    tiendaReserva = tienda._id;
    for (const item of stockItems) {
      const actualizado = await productosStorage.descontarStock(item.productoId, tienda._id, item.cantidad);
      if (!actualizado) {
        await Promise.all(reservas.map((reserva) =>
          productosStorage.reponerStock(reserva.productoId, tienda._id, reserva.cantidad)
        ));
        reservas.length = 0;
        flash(req, 'error', 'Cambió el stock de uno de los productos. Revisá el carrito.');
        return res.redirect(`/tienda/${tienda._id}/carrito`);
      }
      reservas.push(item);
    }

    const pedido = await storage.crear({
      tiendaId: tienda._id,
      items,
      total,
      medioPago,
      medioEnvio,
      comprador: {
        nombre: req.body.nombre?.trim(),
        email: req.body.email?.trim(),
        telefono: req.body.telefono?.trim() || '',
      },
    });
    pedidoCreado = true;

    req.session.carrito = { tiendaId: String(tienda._id), items: [] };
    req.session.ultimoPedidoId = String(pedido._id);

    emitirSocket(req, 'nuevo-pedido', { tienda: tienda.nombre, total: pedido.total });
    res.redirect(`/tienda/${tienda._id}/pedido/${pedido._id}`);
  } catch (error) {
    if (!pedidoCreado && reservas.length > 0 && tiendaReserva) {
      await Promise.allSettled(reservas.map((reserva) =>
        productosStorage.reponerStock(reserva.productoId, tiendaReserva, reserva.cantidad)
      ));
    }
    console.error('Error procesando checkout:', error.message);
    flash(req, 'error', 'No pudimos registrar tu pedido. Revisá tus datos de contacto.');
    res.redirect(`/tienda/${req.params.id}/carrito`);
  }
};

// GET /tienda/:id/pedido/:pedidoId — confirmación pública del pedido
const vistaConfirmacion = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorId(req.params.id);
    if (!tienda) return render404(res, 'Esta tienda no está disponible.');

    const pedido = await storage.buscarPorId(req.params.pedidoId, tienda._id);
    if (!pedido) return render404(res, 'No encontramos ese pedido.');

    const esDueno = !!(req.session?.usuario && String(req.session.usuario.id) === String(tienda.usuarioId));
    const esComprador = req.session?.ultimoPedidoId === String(pedido._id);
    if (!esDueno && !esComprador) {
      return render404(res, 'No encontramos ese pedido.');
    }

    res.render('pedido-confirmacion', {
      tienda,
      pedido,
      medioPagoNombre: resolver(MEDIOS_PAGO, [pedido.medioPago])[0]?.nombre || pedido.medioPago,
      medioEnvioNombre: pedido.medioEnvio ? (resolver(MEDIOS_ENVIO, [pedido.medioEnvio])[0]?.nombre || pedido.medioEnvio) : null,
    });
  } catch (error) {
    console.error('Error cargando confirmación de pedido:', error.message);
    render404(res, 'No encontramos ese pedido.');
  }
};

// GET /mis-pedidos — el dueño ve los pedidos recibidos en su tienda
const vistaMisPedidos = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorUsuario(req.session.usuario.id);
    if (!tienda) return res.redirect('/mi-tienda');

    const pedidos = await storage.listarPorTienda(tienda._id);
    const totalVendido = pedidos
      .filter((p) => p.estado === 'confirmado')
      .reduce((sum, p) => sum + p.total, 0);

    res.render('mis-pedidos', {
      titulo: 'Mis pedidos',
      usuario: req.session.usuario,
      tienda,
      pedidos,
      totalVendido,
      MEDIOS_PAGO,
      MEDIOS_ENVIO,
    });
  } catch (error) {
    console.error('Error cargando mis pedidos:', error.message);
    res.redirect('/mi-tienda');
  }
};

// POST /mis-pedidos/:id/estado — el dueño confirma o cancela un pedido
const cambiarEstadoPedido = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorUsuario(req.session.usuario.id);
    if (!tienda) return res.redirect('/mi-tienda');

    const nuevoEstado = req.body.estado;
    if (!['confirmado', 'cancelado'].includes(nuevoEstado)) {
      return res.redirect('/mis-pedidos');
    }

    const pedido = await storage.buscarPorId(req.params.id, tienda._id);
    if (!pedido || pedido.estado === 'cancelado') return res.redirect('/mis-pedidos');

    // Al cancelar un pedido que no estaba cancelado, devolvemos el stock reservado.
    if (nuevoEstado === 'cancelado' && pedido.estado !== 'cancelado') {
      await Promise.all(pedido.items.map((item) =>
        productosStorage.reponerStock(item.productoId, tienda._id, item.cantidad)
      ));
    }

    await storage.actualizarEstado(req.params.id, tienda._id, nuevoEstado);
    flash(req, 'ok', nuevoEstado === 'confirmado' ? 'Pedido confirmado.' : 'Pedido cancelado y stock repuesto.');
    res.redirect('/mis-pedidos');
  } catch (error) {
    console.error('Error cambiando estado de pedido:', error.message);
    res.redirect('/mis-pedidos');
  }
};

module.exports = { procesarCheckout, vistaConfirmacion, vistaMisPedidos, cambiarEstadoPedido };
