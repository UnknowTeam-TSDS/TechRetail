jest.mock('../../src/modules/Pedidos/storage/pedidosStorage');
jest.mock('../../src/modules/Tienda/storage/tiendaStorage');
jest.mock('../../src/modules/Productos/storage/productosStorage');

const storage = require('../../src/modules/Pedidos/storage/pedidosStorage');
const tiendaStorage = require('../../src/modules/Tienda/storage/tiendaStorage');
const productosStorage = require('../../src/modules/Productos/storage/productosStorage');
const {
  procesarCheckout,
  vistaMisPedidos,
  cambiarEstadoPedido,
} = require('../../src/modules/Pedidos/controllers/pedidosController');

describe('Pedidos Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'tienda-id' },
      body: {},
      session: { usuario: { id: 'user-id' } },
      app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('procesarCheckout', () => {
    const tiendaActiva = {
      _id: 'tienda-id',
      estado: 'activa',
      usuarioId: 'otro-id',
      mediosPago: ['mercadopago'],
      mediosEnvio: ['retiro_local'],
    };
    const productoMock = {
      _id: 'prod-id', nombre: 'Remera', tipo: 'fisico', stock: 5, precio: 1000, precioPromocional: null,
    };

    test('crea el pedido desde el carrito y redirige a la confirmacion', async () => {
      req.body = { medioPago: 'mercadopago', medioEnvio: 'retiro_local', nombre: 'Ana', email: 'ana@email.com', telefono: '123' };
      req.session.carrito = { tiendaId: 'tienda-id', items: [{ productoId: 'prod-id', cantidad: 2 }] };
      tiendaStorage.buscarPorId = jest.fn().mockResolvedValue(tiendaActiva);
      productosStorage.buscarActivosPorIds = jest.fn().mockResolvedValue([productoMock]);
      productosStorage.descontarStock = jest.fn().mockResolvedValue({});
      storage.crear = jest.fn().mockResolvedValue({ _id: 'pedido-id', total: 2000 });

      await procesarCheckout(req, res);

      expect(storage.crear).toHaveBeenCalledWith(expect.objectContaining({
        tiendaId: 'tienda-id',
        total: 2000,
        medioPago: 'mercadopago',
        medioEnvio: 'retiro_local',
        items: [{ productoId: 'prod-id', nombre: 'Remera', precioUnitario: 1000, cantidad: 2, subtotal: 2000 }],
        comprador: expect.objectContaining({ nombre: 'Ana', email: 'ana@email.com', telefono: '123' }),
      }));
      // El stock del producto se descuenta al concretarse la venta
      expect(productosStorage.descontarStock).toHaveBeenCalledWith('prod-id', 'tienda-id', 2);
      // El carrito queda vacío luego de registrar el pedido
      expect(req.session.carrito).toEqual({ tiendaId: 'tienda-id', items: [] });
      expect(res.redirect).toHaveBeenCalledWith('/tienda/tienda-id/pedido/pedido-id');
    });

    test('no crea pedido si el medio de pago no esta habilitado en la tienda', async () => {
      req.body = { medioPago: 'bitcoin', nombre: 'Ana', email: 'ana@email.com' };
      req.session.carrito = { tiendaId: 'tienda-id', items: [{ productoId: 'prod-id', cantidad: 1 }] };
      tiendaStorage.buscarPorId = jest.fn().mockResolvedValue(tiendaActiva);
      productosStorage.buscarActivosPorIds = jest.fn().mockResolvedValue([productoMock]);
      storage.crear = jest.fn();

      await procesarCheckout(req, res);

      expect(storage.crear).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/tienda/tienda-id/carrito');
    });

    test('no crea pedido si el carrito esta vacio', async () => {
      req.body = { medioPago: 'mercadopago', nombre: 'Ana', email: 'ana@email.com' };
      req.session.carrito = { tiendaId: 'tienda-id', items: [] };
      tiendaStorage.buscarPorId = jest.fn().mockResolvedValue(tiendaActiva);
      storage.crear = jest.fn();

      await procesarCheckout(req, res);

      expect(storage.crear).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/tienda/tienda-id/carrito');
    });

    test('responde 404 si la tienda no existe', async () => {
      tiendaStorage.buscarPorId = jest.fn().mockResolvedValue(null);
      storage.crear = jest.fn();

      await procesarCheckout(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ codigo: 404 }));
      expect(storage.crear).not.toHaveBeenCalled();
    });
  });

  describe('vistaMisPedidos', () => {
    test('renderiza los pedidos de la tienda del usuario', async () => {
      const tienda = { _id: 'tienda-id', nombre: 'Mi Tienda' };
      const pedidos = [{ total: 2000 }, { total: 3000 }];
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(tienda);
      storage.listarPorTienda = jest.fn().mockResolvedValue(pedidos);

      await vistaMisPedidos(req, res);

      expect(res.render).toHaveBeenCalledWith('mis-pedidos', expect.objectContaining({
        tienda,
        pedidos,
        totalVendido: 5000,
      }));
    });

    test('redirige a /mi-tienda si el usuario no tiene tienda', async () => {
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(null);

      await vistaMisPedidos(req, res);

      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });
  });

  describe('cambiarEstadoPedido', () => {
    const tienda = { _id: 'tienda-id' };

    test('confirma un pedido pendiente sin tocar el stock', async () => {
      req.params.id = 'pedido-id';
      req.body.estado = 'confirmado';
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(tienda);
      storage.buscarPorId = jest.fn().mockResolvedValue({ estado: 'pendiente', items: [{ productoId: 'p1', cantidad: 2 }] });
      storage.actualizarEstado = jest.fn().mockResolvedValue({});
      productosStorage.reponerStock = jest.fn();

      await cambiarEstadoPedido(req, res);

      expect(productosStorage.reponerStock).not.toHaveBeenCalled();
      expect(storage.actualizarEstado).toHaveBeenCalledWith('pedido-id', 'tienda-id', 'confirmado');
      expect(res.redirect).toHaveBeenCalledWith('/mis-pedidos');
    });

    test('cancelar un pedido repone el stock de sus items', async () => {
      req.params.id = 'pedido-id';
      req.body.estado = 'cancelado';
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(tienda);
      storage.buscarPorId = jest.fn().mockResolvedValue({ estado: 'pendiente', items: [{ productoId: 'p1', cantidad: 3 }] });
      storage.actualizarEstado = jest.fn().mockResolvedValue({});
      productosStorage.reponerStock = jest.fn().mockResolvedValue({});

      await cambiarEstadoPedido(req, res);

      expect(productosStorage.reponerStock).toHaveBeenCalledWith('p1', 'tienda-id', 3);
      expect(storage.actualizarEstado).toHaveBeenCalledWith('pedido-id', 'tienda-id', 'cancelado');
    });

    test('ignora un estado no válido', async () => {
      req.params.id = 'pedido-id';
      req.body.estado = 'inventado';
      tiendaStorage.buscarPorUsuario = jest.fn().mockResolvedValue(tienda);
      storage.actualizarEstado = jest.fn();

      await cambiarEstadoPedido(req, res);

      expect(storage.actualizarEstado).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/mis-pedidos');
    });
  });
});
