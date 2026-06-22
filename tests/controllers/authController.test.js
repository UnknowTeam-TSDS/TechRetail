jest.mock('../../src/modules/usuarios/models/Usuario');
jest.mock('../../src/modules/Planes/models/Plan');

const Usuario = require('../../src/modules/usuarios/models/Usuario');
const Plan = require('../../src/modules/Planes/models/Plan');
const {
  vistaLogin,
  loginUsuario,
  agregarAddon,
  quitarAddon,
} = require('../../src/modules/Auth/controllers/authController');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, session: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('vistaLogin', () => {
    test('renderiza la vista login con titulo correcto', () => {
      vistaLogin(req, res);
      expect(res.render).toHaveBeenCalledWith('login', expect.objectContaining({ titulo: 'Iniciar Sesión' }));
    });
  });

  describe('loginUsuario', () => {
    test('devuelve 400 si no se envia email', async () => {
      req.body = { email: '', contrasena: '123456' };
      await loginUsuario(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.render).toHaveBeenCalledWith('login', expect.objectContaining({ error: expect.any(String) }));
    });

    test('devuelve 400 si no se envia contrasena', async () => {
      req.body = { email: 'admin@test.com', contrasena: '' };
      await loginUsuario(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('devuelve 401 si el usuario no existe en la base de datos', async () => {
      req.body = { email: 'noexiste@test.com', contrasena: '123456' };
      Usuario.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      await loginUsuario(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.render).toHaveBeenCalledWith('login', expect.objectContaining({ error: expect.any(String) }));
    });

    test('renderiza login con error si la contrasena es incorrecta', async () => {
      req.body = { email: 'admin@test.com', contrasena: 'wrong' };
      const mockUsuario = {
        _id: 'mock-id',
        email: 'admin@test.com',
        nombre: 'Admin',
        rol: 'admin',
        estado: 'activo',
        compararContrasena: jest.fn().mockResolvedValue(false),
      };
      Usuario.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsuario),
      });
      await loginUsuario(req, res);
      expect(res.render).toHaveBeenCalledWith('login', expect.objectContaining({ error: expect.any(String) }));
    });

    test('redirige a / si el admin hace login exitoso', async () => {
      req.body = { email: 'admin@test.com', contrasena: '123456' };
      const mockUsuario = {
        _id: 'mock-id',
        email: 'admin@test.com',
        nombre: 'Admin',
        rol: 'admin',
        estado: 'activo',
        compararContrasena: jest.fn().mockResolvedValue(true),
      };
      Usuario.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsuario),
      });
      await loginUsuario(req, res);
      expect(req.session.usuario).toBeDefined();
      expect(req.session.usuario.rol).toBe('admin');
      expect(res.redirect).toHaveBeenCalledWith('/');
    });

    test('devuelve 403 si el usuario esta inactivo', async () => {
      req.body = { email: 'inactivo@test.com', contrasena: '123456' };
      const mockUsuario = {
        _id: 'mock-id',
        email: 'inactivo@test.com',
        nombre: 'Usuario Inactivo',
        rol: 'cliente',
        estado: 'inactivo',
        compararContrasena: jest.fn().mockResolvedValue(true),
      };
      Usuario.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsuario),
      });
      await loginUsuario(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('agregarAddon', () => {
    test('redirige a /mi-cuenta si el addon no existe', async () => {
      req.body = { addonId: 'id-inexistente' };
      req.session.usuario = { id: 'user-id' };
      Plan.findOne = jest.fn().mockResolvedValue(null);
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      await agregarAddon(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/mi-cuenta');
    });

    test('redirige a /mi-cuenta si el usuario esta en trial', async () => {
      req.body = { addonId: 'addon-id' };
      req.session.usuario = { id: 'user-id' };
      const trialFuturo = new Date(Date.now() + 86400000);
      Plan.findOne = jest.fn().mockResolvedValue({ _id: 'addon-id', tipo: 'addon' });
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: trialFuturo });
      await agregarAddon(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/mi-cuenta');
    });

    test('agrega el addon y redirige a /mi-cuenta si tiene plan pago', async () => {
      req.body = { addonId: 'addon-id' };
      req.session.usuario = { id: 'user-id' };
      Plan.findOne = jest.fn().mockResolvedValue({ _id: 'addon-id', tipo: 'addon' });
      Usuario.findById = jest.fn().mockResolvedValue({ planId: 'plan-id', trialHasta: null });
      Usuario.findByIdAndUpdate = jest.fn().mockResolvedValue({});
      await agregarAddon(req, res);
      expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id',
        { $addToSet: { addons: 'addon-id' } }
      );
      expect(res.redirect).toHaveBeenCalledWith('/mi-cuenta');
    });
  });

  describe('quitarAddon', () => {
    test('quita el addon y redirige a /mi-cuenta', async () => {
      req.body = { addonId: 'addon-id' };
      req.session.usuario = { id: 'user-id' };
      Usuario.findByIdAndUpdate = jest.fn().mockResolvedValue({});
      await quitarAddon(req, res);
      expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id',
        { $pull: { addons: 'addon-id' } }
      );
      expect(res.redirect).toHaveBeenCalledWith('/mi-cuenta');
    });
  });
});
