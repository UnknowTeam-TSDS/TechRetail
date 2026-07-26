const validarObjectId = require('../../src/middlewares/validarObjectId');

describe('validarObjectId', () => {
  let res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('continúa si el identificador es válido', () => {
    const req = { params: { id: '507f1f77bcf86cd799439011' }, originalUrl: '/tienda/507f1f77bcf86cd799439011' };

    validarObjectId('id')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('renderiza 404 para una ruta web con identificador inválido', () => {
    const req = { params: { id: 'invalido' }, originalUrl: '/tienda/invalido' };

    validarObjectId('id')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ codigo: 404 }));
  });

  test('responde 400 JSON para una ruta API con identificador inválido', () => {
    const req = { params: { id: 'invalido' }, originalUrl: '/api/planes/invalido' };

    validarObjectId('id')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });
});