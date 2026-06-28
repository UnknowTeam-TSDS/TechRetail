jest.mock('../../src/modules/Productos/storage/productosStorage');
jest.mock('../../src/modules/Tienda/storage/tiendaStorage');

const storage = require('../../src/modules/Productos/storage/productosStorage');
const tiendaStorage = require('../../src/modules/Tienda/storage/tiendaStorage');
const {
  vistaProductos,
  vistaEditarProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  cambiarEstadoProducto,
} = require('../../src/modules/Productos/controllers/productosController');

describe('Productos Controller', () => {
  let req, res;
  const mockTienda = { _id: 'tienda-id', nombre: 'Mi Tienda', colorPrimario: '#1D4ED8' };

  beforeEach(() => {
    req = { body: {}, params: {}, files: [], session: { usuario: { id: 'user-id' } } };
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
      storage.categoriasPorTienda = jest.fn().mockResolvedValue(['Ropa']);

      await vistaProductos(req, res);

      expect(res.render).toHaveBeenCalledWith('mis-productos', expect.objectContaining({
        tienda: mockTienda,
        productos: mockProductos,
        productoEditando: null,
      }));
    });
  });

  describe('vistaEditarProducto', () => {
    test('redirige a /mis-productos si el producto no pertenece a la tienda', async () => {
      req.params = { id: 'producto-id' };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.buscarPorId = jest.fn().mockResolvedValue(null);

      await vistaEditarProducto(req, res);

      expect(res.redirect).toHaveBeenCalledWith('/mis-productos');
    });

    test('renderiza mis-productos con productoEditando', async () => {
      req.params = { id: 'producto-id' };
      const mockProducto = { _id: 'producto-id', nombre: 'Remera' };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.buscarPorId = jest.fn().mockResolvedValue(mockProducto);
      storage.listarPorTienda = jest.fn().mockResolvedValue([mockProducto]);
      storage.categoriasPorTienda = jest.fn().mockResolvedValue(['Ropa']);

      await vistaEditarProducto(req, res);

      expect(res.render).toHaveBeenCalledWith('mis-productos', expect.objectContaining({
        productoEditando: mockProducto,
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
      req.body = {
        nombre: 'Remera',
        descripcion: 'Algodon',
        precio: '1500',
        stock: '10',
        categoria: 'Ropa',
        tipo: 'fisico',
        pesoKg: '0.5',
        altoCm: '10',
        anchoCm: '20',
        largoCm: '30',
      };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.agregar = jest.fn().mockResolvedValue({});

      await crearProducto(req, res);

      expect(storage.agregar).toHaveBeenCalledWith(expect.objectContaining({
        tiendaId: 'tienda-id',
        nombre: 'Remera',
        precio: 1500,
        stock: 10,
        pesoKg: 0.5,
        dimensiones: { altoCm: 10, anchoCm: 20, largoCm: 30 },
      }));
      expect(res.redirect).toHaveBeenCalledWith('/mis-productos');
    });

    test('emite evento websocket cuando crea un producto', async () => {
      const emit = jest.fn();
      req.app = { get: jest.fn().mockReturnValue({ emit }) };
      req.body = {
        nombre: 'Remera',
        precio: '1500',
        stock: '10',
        categoria: 'Ropa',
        tipo: 'fisico',
        pesoKg: '0.5',
        altoCm: '10',
        anchoCm: '20',
        largoCm: '30',
      };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.agregar = jest.fn().mockResolvedValue({ nombre: 'Remera', categoria: 'Ropa' });

      await crearProducto(req, res);

      expect(emit).toHaveBeenCalledWith('nuevo-producto', {
        nombre: 'Remera',
        tienda: 'Mi Tienda',
        categoria: 'Ropa',
      });
    });
  });

  describe('actualizarProducto', () => {
    test('actualiza el producto de la tienda y conserva imagenes anteriores', async () => {
      req.params = { id: 'producto-id' };
      req.body = {
        nombre: 'Remera editada',
        precio: '2000',
        stock: '5',
        tipo: 'fisico',
        pesoKg: '0.7',
        altoCm: '11',
        anchoCm: '21',
        largoCm: '31',
      };
      req.files = [{ filename: 'nueva.jpg' }];
      const productoActual = { _id: 'producto-id', imagenes: ['/uploads/productos/vieja.jpg'] };
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      storage.buscarPorId = jest.fn().mockResolvedValue(productoActual);
      storage.actualizar = jest.fn().mockResolvedValue({});

      await actualizarProducto(req, res);

      expect(storage.actualizar).toHaveBeenCalledWith('producto-id', 'tienda-id', expect.objectContaining({
        nombre: 'Remera editada',
        imagenes: ['/uploads/productos/vieja.jpg', '/uploads/productos/nueva.jpg'],
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
