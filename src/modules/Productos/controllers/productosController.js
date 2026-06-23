const storage = require('../storage/productosStorage');
const tiendaStorage = require('../../Tienda/storage/tiendaStorage');

// GET /mis-productos
const vistaProductos = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorUsuario(req.session.usuario.id);
    if (!tienda) return res.redirect('/mi-tienda');

    const [productos, categorias] = await Promise.all([
      storage.listarPorTienda(tienda._id),
      storage.categoriasPorTienda(tienda._id),
    ]);

    res.render('mis-productos', {
      titulo: 'Mis productos',
      usuario: req.session.usuario,
      tienda,
      productos,
      categorias,
    });
  } catch (error) {
    console.error('Error cargando productos:', error.message);
    res.redirect('/mi-tienda');
  }
};

// POST /mis-productos/form
const crearProducto = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorUsuario(req.session.usuario.id);
    if (!tienda) return res.redirect('/mi-tienda');

    const { nombre, descripcion, precio, precioPromocional, tipo, stock, categoria,
            destacado, esNovedad, esOferta, tags, tituloSEO, descripcionSEO } = req.body;

    await storage.agregar({
      tiendaId: tienda._id,
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      precio: parseFloat(precio),
      precioPromocional: precioPromocional ? parseFloat(precioPromocional) : null,
      tipo: tipo || 'fisico',
      stock: parseInt(stock) || 0,
      categoria: categoria?.trim(),
      imagenes: req.files && req.files.length > 0
        ? req.files.map(f => '/uploads/productos/' + f.filename)
        : [],
      destacado: destacado === 'on',
      esNovedad: esNovedad === 'on',
      esOferta:  esOferta  === 'on',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      tituloSEO: tituloSEO?.trim(),
      descripcionSEO: descripcionSEO?.trim(),
    });

    res.redirect('/mis-productos');
  } catch (error) {
    console.error('Error creando producto:', error.message);
    res.redirect('/mis-productos');
  }
};

// POST /mis-productos/eliminar/:id
const eliminarProducto = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorUsuario(req.session.usuario.id);
    if (!tienda) return res.redirect('/mi-tienda');

    await storage.eliminar(req.params.id, tienda._id);
    res.redirect('/mis-productos');
  } catch (error) {
    console.error('Error eliminando producto:', error.message);
    res.redirect('/mis-productos');
  }
};

// POST /mis-productos/estado/:id
const cambiarEstadoProducto = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorUsuario(req.session.usuario.id);
    if (!tienda) return res.redirect('/mi-tienda');

    const activo = req.body.activo === 'true';
    await storage.cambiarEstado(req.params.id, tienda._id, activo);
    res.redirect('/mis-productos');
  } catch (error) {
    console.error('Error cambiando estado producto:', error.message);
    res.redirect('/mis-productos');
  }
};

module.exports = { vistaProductos, crearProducto, eliminarProducto, cambiarEstadoProducto };
