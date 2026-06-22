jest.mock('../../src/modules/Productos/storage/productosStorage');
jest.mock('../../src/modules/Tienda/storage/tiendaStorage');

const storage = require('../../src/modules/Productos/storage/productosStorage');
const tiendaStorage = require('../../src/modules/Tienda/storage/tiendaStorage');
const {
  vistaProductos,
  crearProducto,
  eliminarProducto,
  cambiarEstadoProducto,
} = require('../../src/modules/Productos/controllers/productosController');

describe('Productos Controller', () => {
  let req, res;
  const mockTienda = { _id: 'tienda-id', nombre: 'Mi Tienda', colorPrimario: '#1D4ED8' };

  beforeEach(() => {
    req = { body: {}, params: {}, session: { usuario: { id: 'user-id' } } };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('vistaProductos', () => {
    test('redirige a /mi-tienda si el usuario no tiene tienda', async () => {
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(null);
      await vistaProductos(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('renderiza mis-productos con los productos de la tienda', async () => {
      const mockProductos = [{ nombre: 'Remera', precio: 1500 }];
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.listarPorTienda = jest.fn().mockResolvedValue(mockProductos);

      await vistaProductos(req, res);

      expect(res.render).toHaveBeenCalledWith('mis-productos', expect.objectContaining({
        tienda: mockTienda,
        productos: mockProductos,
      }));
    });
  });

  describe('crearProducto', () => {
    test('redirige a /mi-tienda si el usuario no tiene tienda', async () => {
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(null);
      await crearProducto(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('crea el producto y redirige a /mis-productos', async () => {
      req.body = { nombre: 'Remera', descripcion: 'Algodón', precio: '1500', stock: '10', categoria: 'Ropa' };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.agregar = jest.fn().mockResolvedValue({});

      await crearProducto(req, res);

      expect(storage.agregar).toHaveBeenCalledWith(expect.objectContaining({
        tiendaId: 'tienda-id',
        nombre: 'Remera',
        precio: 1500,
        stock: 10,
      }));
      expect(res.redirect).toHaveBeenCalledWith('/mis-productos');
    });
  });

  describe('eliminarProducto', () => {
    test('elimina el producto y redirige a /mis-productos', async () => {
      req.params = { id: 'producto-id' };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.eliminar = jest.fn().mockResolvedValue({});

      await eliminarProducto(req, res);

      expect(storage.eliminar).toHaveBeenCalledWith('producto-id', 'tienda-id');
      expect(res.redirect).toHaveBeenCalledWith('/mis-productos');
    });
  });

  describe('cambiarEstadoProducto', () => {
    test('cambia el estado a false y redirige', async () => {
      req.params = { id: 'producto-id' };
      req.body = { activo: 'false' };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.cambiarEstado = jest.fn().mockResolvedValue({});

      await cambiarEstadoProducto(req, res);

      expect(storage.cambiarEstado).toHaveBeenCalledWith('producto-id', 'tienda-id', false);
      expect(res.redirect).toHaveBeenCalledWith('/mis-productos');
    });
  });
});
