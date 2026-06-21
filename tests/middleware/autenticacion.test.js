const { verificarSesion, verificarAdmin } = require('../../src/middlewares/autenticacion');

describe('verificarSesion', () => {
  let req, res, next;

  beforeEach(() => {
    req = { session: {} };
    res = { redirect: jest.fn() };
    next = jest.fn();
  });

  test('redirige a /login si no hay sesion activa', () => {
    verificarSesion(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('llama a next() si hay sesion activa', () => {
    req.session.usuario = { email: 'user@test.com', rol: 'cliente' };
    verificarSesion(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});

describe('verificarAdmin', () => {
  let req, res, next;

  beforeEach(() => {
    req = { session: {} };
    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('redirige a /login si no hay sesion', () => {
    verificarAdmin(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('devuelve 403 si el usuario no es admin', () => {
    req.session.usuario = { email: 'user@test.com', rol: 'cliente' };
    verificarAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('llama a next() si el usuario es admin', () => {
    req.session.usuario = { email: 'admin@test.com', rol: 'admin' };
    verificarAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
