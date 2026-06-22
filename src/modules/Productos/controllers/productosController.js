const storage = require('../storage/productosStorage');
const tiendaStorage = require('../../Tienda/storage/tiendaStorage');

// GET /mis-productos
const vistaProductos = async (req, res) => {
  try {
    const tienda = await tiendaStorage.buscarPorUsuario(req.session.usuario.id);
    if (!tienda) return res.redirect('/mi-tienda');

    const productos = await storage.listarPorTienda(tienda._id);

    res.render('mis-productos', {
      titulo: 'Mis productos',
      usuario: req.session.usuario,
      tienda,
      productos,
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

    const { nombre, descripcion, precio, stock, categoria } = req.body;

    await storage.agregar({
      tiendaId: tienda._id,
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      precio: parseFloat(precio),
      stock: parseInt(stock) || 0,
      categoria: categoria?.trim(),
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
