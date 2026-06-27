jest.mock('../../src/modules/Tienda/storage/tiendaStorage');
jest.mock('../../src/modules/usuarios/models/Usuario');

const storage = require('../../src/modules/Tienda/storage/tiendaStorage');
const Usuario = require('../../src/modules/usuarios/models/Usuario');
const { vistaTienda, guardarTienda, publicarTienda, despublicarTienda } = require('../../src/modules/Tienda/controllers/tiendaController');

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

    test('si esta en trial, una tienda activa vuelve a construccion', async () => {
      req.body = { nombre: 'Tienda Test', rubro: 'moda' };
      const trialFuturo = new Date(Date.now() + 86400000);
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: trialFuturo });
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
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      storage.actualizarEstado = jest.fn().mockResolvedValue({});

      await publicarTienda(req, res);

      expect(storage.actualizarEstado).toHaveBeenCalledWith('user-id', 'activa');
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('no publica si el usuario esta en trial', async () => {
      const trialFuturo = new Date(Date.now() + 86400000);
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: trialFuturo });
      storage.actualizarEstado = jest.fn().mockResolvedValue({});

      await publicarTienda(req, res);

      expect(storage.actualizarEstado).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/mi-tienda');
    });

    test('no publica si el usuario no tiene plan', async () => {
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
});
