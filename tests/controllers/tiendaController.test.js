jest.mock('../../src/modules/Tienda/storage/tiendaStorage');
jest.mock('../../src/modules/usuarios/models/Usuario');

const storage = require('../../src/modules/Tienda/storage/tiendaStorage');
const Usuario = require('../../src/modules/usuarios/models/Usuario');
const { vistaTienda, guardarTienda } = require('../../src/modules/Tienda/controllers/tiendaController');

describe('Tienda Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, session: { usuario: { id: 'user-id' } }, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn(),
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
    test('guarda la tienda y redirige a /mi-tienda', async () => {
      req.body = { nombre: 'Tienda Test', descripcion: 'Desc', rubro: 'moda', colorPrimario: '#FF0000', estado: 'activa' };
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      storage.guardarTienda = jest.fn().mockResolvedValue({});

      await guardarTienda(req, res);

      expect(storage.guardarTienda).toHaveBeenCalledWith('user-id', expect.objectContaining({
        nombre: 'Tienda Test',
        rubro: 'moda',
        estado: 'activa',
      }));
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('fuerza estado en_construccion si el usuario esta en trial', async () => {
      req.body = { nombre: 'Tienda Test', rubro: 'moda', estado: 'activa' };
      const trialFuturo = new Date(Date.now() + 86400000);
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: trialFuturo });
      storage.guardarTienda = jest.fn().mockResolvedValue({});

      await guardarTienda(req, res);

      expect(storage.guardarTienda).toHaveBeenCalledWith('user-id', expect.objectContaining({
        estado: 'en_construccion',
      }));
    });
  });
});
