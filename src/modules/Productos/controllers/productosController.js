const storage = require('../storage/productosStorage');
const tiendaStorage = require('../../Tienda/storage/tiendaStorage');

const emitirSocket = (req, evento, datos) => {
  const io = req.app?.get?.('io');
  if (io) io.emit(evento, datos);
};

const obtenerTiendaDelUsuario = async (req) => {
  return tiendaStorage.buscarPorUsuario(req.session.usuario.id);
};

const normalizarProducto = (body, tiendaId, files = [], imagenesActuales = []) => {
  const { nombre, descripcion, precio, precioPromocional, tipo, stock, categoria,
          destacado, esNovedad, esOferta, tags, tituloSEO, descripcionSEO,
          pesoKg, altoCm, anchoCm, largoCm } = body;

  const tipoProducto = tipo || 'fisico';
  const nuevasImagenes = files.length > 0
    ? files.map(f => '/uploads/productos/' + f.filename)
    : [];

  const datos = {
    tiendaId,
    nombre: nombre?.trim(),
    descripcion: descripcion?.trim(),
    precio: parseFloat(precio),
    precioPromocional: precioPromocional ? parseFloat(precioPromocional) : null,
    tipo: tipoProducto,
    stock: parseInt(stock) || 0,
    categoria: categoria?.trim(),
    imagenes: [...imagenesActuales, ...nuevasImagenes],
    destacado: destacado === 'on',
    esNovedad: esNovedad === 'on',
    esOferta: esOferta === 'on',
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    tituloSEO: tituloSEO?.trim(),
    descripcionSEO: descripcionSEO?.trim(),
  };

  if (tipoProducto === 'fisico') {
    datos.pesoKg = parseFloat(pesoKg);
    datos.dimensiones = {
      altoCm: parseFloat(altoCm),
      anchoCm: parseFloat(anchoCm),
      largoCm: parseFloat(largoCm),
    };
  } else {
    datos.pesoKg = undefined;
    datos.dimensiones = undefined;
  }

  return datos;
};

const renderProductos = async (req, res, productoEditando = null) => {
  const tienda = await obtenerTiendaDelUsuario(req);
  if (!tienda) return res.redirect('/mi-tienda');

  const [productos, categorias] = await Promise.all([
    storage.listarPorTienda(tienda._id),
    storage.categoriasPorTienda(tienda._id),
  ]);

  return res.render('mis-productos', {
    titulo: 'Mis productos',
    usuario: req.session.usuario,
    tienda,
    productos,
    categorias,
    productoEditando,
  });
};

const vistaProductos = async (req, res) => {
  try {
    await renderProductos(req, res);
  } catch (error) {
    console.error('Error cargando productos:', error.message);
    res.redirect('/mi-tienda');
  }
};

const vistaEditarProducto = async (req, res) => {
  try {
    const tienda = await obtenerTiendaDelUsuario(req);
    if (!tienda) return res.redirect('/mi-tienda');

    const producto = await storage.buscarPorId(req.params.id, tienda._id);
    if (!producto) return res.redirect('/mis-productos');

    const [productos, categorias] = await Promise.all([
      storage.listarPorTienda(tienda._id),
      storage.categoriasPorTienda(tienda._id),
    ]);

    res.render('mis-productos', {
      titulo: 'Editar producto',
      usuario: req.session.usuario,
      tienda,
      productos,
      categorias,
      productoEditando: producto,
    });
  } catch (error) {
    console.error('Error cargando producto para editar:', error.message);
    res.redirect('/mis-productos');
  }
};

const crearProducto = async (req, res) => {
  try {
    const tienda = await obtenerTiendaDelUsuario(req);
    if (!tienda) return res.redirect('/mi-tienda');

    const producto = await storage.agregar(normalizarProducto(req.body, tienda._id, req.files || []));
    emitirSocket(req, 'nuevo-producto', {
      nombre: producto.nombre,
      tienda: tienda.nombre,
      categoria: producto.categoria,
    });
    res.redirect('/mis-productos');
  } catch (error) {
    console.error('Error creando producto:', error.message);
    res.redirect('/mis-productos');
  }
};

const actualizarProducto = async (req, res) => {
  try {
    const tienda = await obtenerTiendaDelUsuario(req);
    if (!tienda) return res.redirect('/mi-tienda');

    const producto = await storage.buscarPorId(req.params.id, tienda._id);
    if (!producto) return res.redirect('/mis-productos');

    const imagenesActuales = producto.imagenes || [];
    const datos = normalizarProducto(req.body, tienda._id, req.files || [], imagenesActuales);

    await storage.actualizar(req.params.id, tienda._id, datos);
    res.redirect('/mis-productos');
  } catch (error) {
    console.error('Error actualizando producto:', error.message);
    res.redirect('/mis-productos/editar/' + req.params.id);
  }
};

const eliminarProducto = async (req, res) => {
  try {
    const tienda = await obtenerTiendaDelUsuario(req);
    if (!tienda) return res.redirect('/mi-tienda');

    await storage.eliminar(req.params.id, tienda._id);
    res.redirect('/mis-productos');
  } catch (error) {
    console.error('Error eliminando producto:', error.message);
    res.redirect('/mis-productos');
  }
};

const cambiarEstadoProducto = async (req, res) => {
  try {
    const tienda = await obtenerTiendaDelUsuario(req);
    if (!tienda) return res.redirect('/mi-tienda');

    const activo = req.body.activo === 'true';
    await storage.cambiarEstado(req.params.id, tienda._id, activo);
    res.redirect('/mis-productos');
  } catch (error) {
    console.error('Error cambiando estado producto:', error.message);
    res.redirect('/mis-productos');
  }
};

module.exports = {
  vistaProductos,
  vistaEditarProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  cambiarEstadoProducto,
};
