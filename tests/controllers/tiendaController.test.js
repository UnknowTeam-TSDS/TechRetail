jest.mock('../../src/modules/Tienda/storage/tiendaStorage');
jest.mock('../../src/modules/Productos/storage/productosStorage');
jest.mock('../../src/modules/usuarios/models/Usuario');

const storage = require('../../src/modules/Tienda/storage/tiendaStorage');
const productosStorage = require('../../src/modules/Productos/storage/productosStorage');
const Usuario = require('../../src/modules/usuarios/models/Usuario');
const {
  vistaTienda,
  guardarTienda,
  publicarTienda,
  despublicarTienda,
  guardarMediosPago,
  guardarMediosEnvio,
  vistaCarrito,
  agregarProductoCarrito,
  actualizarProductoCarrito,
} = require('../../src/modules/Tienda/controllers/tiendaController');

describe('Tienda Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, session: { usuario: { id: 'user-id' } }, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('vistaTienda', () => {
    test('renderiza mi-tienda con la tienda del usuario', async () => {
      const mockTienda = { nombre: 'Mi Tienda', rubro: 'moda', estado: 'en_construccion' };
      const mockUsuario = { planId: 'plan-id', trialHasta: null };
      storage.buscarPorUsuario = jest.fn().mockResolvedValue(mockTienda);
      Usuario.findById = jest.fn().mockResolvedValue(mockUsuario);

      await vistaTienda(req, res);

      expect(res.render).toHaveBeenCalledWith('mi-tienda', expect.objectContaining({
        tienda: mockTienda,
        enTrial: false,
        planPago: true,
      }));
    });

    test('enTrial es true si trialHasta esta en el futuro', async () => {
      const trialFuturo = new Date(Date.now() + 86400000);
      storage.buscarPorUsuario = jest.fn().mockResolvedValue(null);
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: trialFuturo });

      await vistaTienda(req, res);

      expect(res.render).toHaveBeenCalledWith('mi-tienda', expect.objectContaining({
        enTrial: true,
        planPago: false,
      }));
    });

    test('redirige a /mi-cuenta si hay un error', async () => {
      storage.buscarPorUsuario = jest.fn().mockRejectedValue(new Error('DB error'));
      Usuario.findById = jest.fn().mockResolvedValue({});

      await vistaTienda(req, res);

      expect(res.redirect).toHaveBeenCalledWith('/mi-cuenta');
    });
  });

  describe('guardarTienda', () => {
    test('guarda los datos preservando el estado actual de la tienda', async () => {
      req.body = { nombre: 'Tienda Test', descripcion: 'Desc', rubro: 'moda' };
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      storage.buscarPorUsuario = jest.fn().mockResolvedValue({ estado: 'activa' });
      storage.guardarTienda = jest.fn().mockResolvedValue({});

      await guardarTienda(req, res);

      expect(storage.guardarTienda).toHaveBeenCalledWith('user-id', expect.objectContaining({
        nombre: 'Tienda Test',
        rubro: 'moda',
        estado: 'activa',
      }));
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('una tienda nueva arranca en construccion', async () => {
      req.body = { nombre: 'Nueva', rubro: 'moda' };
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      storage.buscarPorUsuario = jest.fn().mockResolvedValue(null);
      storage.guardarTienda = jest.fn().mockResolvedValue({});

      await guardarTienda(req, res);

      expect(storage.guardarTienda).toHaveBeenCalledWith('user-id', expect.objectContaining({
        estado: 'en_construccion',
      }));
    });

    test('emite evento websocket cuando se crea una tienda nueva', async () => {
      const emit = jest.fn();
      req.app = { get: jest.fn().mockReturnValue({ emit }) };
      req.body = { nombre: 'Nueva Tienda', rubro: 'moda' };
      req.session.usuario.nombre = 'Cliente Test';
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      storage.buscarPorUsuario = jest.fn().mockResolvedValue(null);
      storage.guardarTienda = jest.fn().mockResolvedValue({ nombre: 'Nueva Tienda', rubro: 'moda' });

      await guardarTienda(req, res);

      expect(emit).toHaveBeenCalledWith('nueva-tienda', {
        nombre: 'Nueva Tienda',
        rubro: 'moda',
        usuario: 'Cliente Test',
      });
    });

    test('una tienda activa se mantiene activa durante la prueba gratuita', async () => {
      req.body = { nombre: 'Tienda Test', rubro: 'moda' };
      const trialFuturo = new Date(Date.now() + 86400000);
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: trialFuturo });
      storage.buscarPorUsuario = jest.fn().mockResolvedValue({ estado: 'activa' });
      storage.guardarTienda = jest.fn().mockResolvedValue({});

      await guardarTienda(req, res);

      expect(storage.guardarTienda).toHaveBeenCalledWith('user-id', expect.objectContaining({
        estado: 'activa',
      }));
    });

    test('sin plan, una tienda activa vuelve a construccion', async () => {
      req.body = { nombre: 'Tienda Test', rubro: 'moda' };
      Usuario.findById = jest.fn().mockResolvedValue({ planId: null, trialHasta: null });
      storage.buscarPorUsuario = jest.fn().mockResolvedValue({ estado: 'activa' });
      storage.guardarTienda = jest.fn().mockResolvedValue({});

      await guardarTienda(req, res);

      expect(storage.guardarTienda).toHaveBeenCalledWith('user-id', expect.objectContaining({
        estado: 'en_construccion',
      }));
    });
  });

  describe('publicarTienda', () => {
    test('publica la tienda si el usuario tiene plan pago', async () => {
      const emit = jest.fn();
      req.app = { get: jest.fn().mockReturnValue({ emit }) };
      req.session.usuario.nombre = 'Cliente Test';
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      storage.actualizarEstado = jest.fn().mockResolvedValue({ nombre: 'Tienda Test' });

      await publicarTienda(req, res);

      expect(storage.actualizarEstado).toHaveBeenCalledWith('user-id', 'activa');
      expect(emit).toHaveBeenCalledWith('tienda-publicada', {
        nombre: 'Tienda Test',
        usuario: 'Cliente Test',
      });
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('publica durante la prueba gratuita si el usuario tiene un plan', async () => {
      const emit = jest.fn();
      req.app = { get: jest.fn().mockReturnValue({ emit }) };
      req.session.usuario.nombre = 'Cliente Test';
      const trialFuturo = new Date(Date.now() + 86400000);
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: trialFuturo });
      storage.actualizarEstado = jest.fn().mockResolvedValue({ nombre: 'Tienda Test' });

      await publicarTienda(req, res);

      expect(storage.actualizarEstado).toHaveBeenCalledWith('user-id', 'activa');
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('no publica si el usuario no tiene ningún plan', async () => {
      Usuario.findById = jest.fn().mockResolvedValue({ planId: null, trialHasta: null });
      storage.actualizarEstado = jest.fn().mockResolvedValue({});

      await publicarTienda(req, res);

      expect(storage.actualizarEstado).not.toHaveBeenCalled();
    });
  });

  describe('despublicarTienda', () => {
    test('despublica la tienda (estado inactiva) y redirige', async () => {
      storage.actualizarEstado = jest.fn().mockResolvedValue({});

      await despublicarTienda(req, res);

      expect(storage.actualizarEstado).toHaveBeenCalledWith('user-id', 'inactiva');
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });
  });

  describe('guardarMediosPago', () => {
    test('guarda solo los medios de pago validos del catalogo', async () => {
      req.body = { medios: ['mercadopago', 'transferencia', 'bitcoin'] };
      storage.actualizarMediosPago = jest.fn().mockResolvedValue({});

      await guardarMediosPago(req, res);

      expect(storage.actualizarMediosPago).toHaveBeenCalledWith('user-id', ['mercadopago', 'transferencia']);
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('normaliza un unico medio (string) a un arreglo', async () => {
      req.body = { medios: 'efectivo' };
      storage.actualizarMediosPago = jest.fn().mockResolvedValue({});

      await guardarMediosPago(req, res);

      expect(storage.actualizarMediosPago).toHaveBeenCalledWith('user-id', ['efectivo']);
    });

    test('guarda un arreglo vacio si no se selecciona ningun medio', async () => {
      req.body = {};
      storage.actualizarMediosPago = jest.fn().mockResolvedValue({});

      await guardarMediosPago(req, res);

      expect(storage.actualizarMediosPago).toHaveBeenCalledWith('user-id', []);
    });
  });

  describe('guardarMediosEnvio', () => {
    test('guarda medios validos y el monto de envio gratis', async () => {
      req.body = { medios: ['retiro_local', 'envio_gratis'], envioGratisMonto: '50000' };
      storage.actualizarMediosEnvio = jest.fn().mockResolvedValue({});

      await guardarMediosEnvio(req, res);

      expect(storage.actualizarMediosEnvio).toHaveBeenCalledWith('user-id', ['retiro_local', 'envio_gratis'], 50000);
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('descarta el monto de envio gratis si no es un numero positivo', async () => {
      req.body = { medios: ['oca'], envioGratisMonto: '' };
      storage.actualizarMediosEnvio = jest.fn().mockResolvedValue({});

      await guardarMediosEnvio(req, res);

      expect(storage.actualizarMediosEnvio).toHaveBeenCalledWith('user-id', ['oca'], null);
    });
  });

  describe('carrito publico', () => {
    test('renderiza carrito vacio para una tienda activa', async () => {
      req.params.id = 'tienda-id';
      storage.buscarPorId = jest.fn().mockResolvedValue({ _id: 'tienda-id', estado: 'activa', nombre: 'Tienda Test', usuarioId: 'otro-id' });

      await vistaCarrito(req, res);

      expect(res.render).toHaveBeenCalledWith('carrito-publico', expect.objectContaining({
        items: [],
        total: 0,
        cantidadTotal: 0,
        previsualizando: false,
      }));
      expect(req.session.carrito).toEqual({ tiendaId: 'tienda-id', items: [] });
    });

    test('permite al dueño simular el carrito aunque la tienda no este publicada', async () => {
      req.params.id = 'tienda-id';
      storage.buscarPorId = jest.fn().mockResolvedValue({
        _id: 'tienda-id',
        estado: 'en_construccion',
        nombre: 'Tienda Test',
        usuarioId: 'user-id',
      });

      await vistaCarrito(req, res);

      expect(res.render).toHaveBeenCalledWith('carrito-publico', expect.objectContaining({
        previsualizando: true,
      }));
    });

    test('bloquea carrito de tienda no publicada para visitantes externos', async () => {
      req.params.id = 'tienda-id';
      req.session = {};
      storage.buscarPorId = jest.fn().mockResolvedValue({
        _id: 'tienda-id',
        estado: 'en_construccion',
        nombre: 'Tienda Test',
        usuarioId: 'user-id',
      });

      await vistaCarrito(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ codigo: 404 }));
    });

    test('agrega un producto activo al carrito de la tienda', async () => {
      req.params = { id: 'tienda-id', productoId: 'prod-id' };
      req.body = { cantidad: '2' };
      storage.buscarPorId = jest.fn().mockResolvedValue({ _id: 'tienda-id', estado: 'activa', usuarioId: 'otro-id' });
      productosStorage.buscarPublicoPorId = jest.fn().mockResolvedValue({
        _id: 'prod-id',
        tipo: 'fisico',
        stock: 5,
      });

      await agregarProductoCarrito(req, res);

      expect(req.session.carrito.items).toEqual([{ productoId: 'prod-id', cantidad: 2 }]);
      expect(res.redirect).toHaveBeenCalledWith('/tienda/tienda-id/carrito');
    });

    test('permite agregar productos desde la vista previa del dueño', async () => {
      req.params = { id: 'tienda-id', productoId: 'prod-id' };
      req.body = { cantidad: '1' };
      storage.buscarPorId = jest.fn().mockResolvedValue({
        _id: 'tienda-id',
        estado: 'en_construccion',
        usuarioId: 'user-id',
      });
      productosStorage.buscarPublicoPorId = jest.fn().mockResolvedValue({
        _id: 'prod-id',
        tipo: 'fisico',
        stock: 5,
      });

      await agregarProductoCarrito(req, res);

      expect(req.session.carrito.items).toEqual([{ productoId: 'prod-id', cantidad: 1 }]);
      expect(res.redirect).toHaveBeenCalledWith('/tienda/tienda-id/carrito');
    });

    test('limita la cantidad agregada segun el stock disponible', async () => {
      req.params = { id: 'tienda-id', productoId: 'prod-id' };
      req.body = { cantidad: '8' };
      storage.buscarPorId = jest.fn().mockResolvedValue({ _id: 'tienda-id', estado: 'activa', usuarioId: 'otro-id' });
      productosStorage.buscarPublicoPorId = jest.fn().mockResolvedValue({
        _id: 'prod-id',
        tipo: 'fisico',
        stock: 3,
      });

      await agregarProductoCarrito(req, res);

      expect(req.session.carrito.items).toEqual([{ productoId: 'prod-id', cantidad: 3 }]);
    });

    test('actualiza cantidad y respeta el maximo de stock', async () => {
      req.params = { id: 'tienda-id', productoId: 'prod-id' };
      req.body = { cantidad: '9' };
      req.session.carrito = { tiendaId: 'tienda-id', items: [{ productoId: 'prod-id', cantidad: 1 }] };
      storage.buscarPorId = jest.fn().mockResolvedValue({ _id: 'tienda-id', estado: 'activa', usuarioId: 'otro-id' });
      productosStorage.buscarPublicoPorId = jest.fn().mockResolvedValue({
        _id: 'prod-id',
        tipo: 'fisico',
        stock: 4,
      });

      await actualizarProductoCarrito(req, res);

      expect(req.session.carrito.items).toEqual([{ productoId: 'prod-id', cantidad: 4 }]);
      expect(res.redirect).toHaveBeenCalledWith('/tienda/tienda-id/carrito');
    });
  });
});
