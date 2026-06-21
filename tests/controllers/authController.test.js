jest.mock('../../src/modules/usuarios/models/Usuario');

const Usuario = require('../../src/modules/usuarios/models/Usuario');
const { vistaLogin, loginUsuario } = require('../../src/modules/Auth/controllers/authController');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, session: {} };
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
      expect(res.render).toHaveBeenCalledWith('login', { titulo: 'Iniciar Sesión' });
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

    test('redirige a /planes/vista si el admin hace login exitoso', async () => {
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
      expect(res.redirect).toHaveBeenCalledWith('/planes/vista');
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
});
