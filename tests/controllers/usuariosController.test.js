jest.mock('../../src/modules/usuarios/storage/usuariosStorage');

const storage = require('../../src/modules/usuarios/storage/usuariosStorage');
const {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  eliminarUsuarioForm,
  cambiarEstado,
} = require('../../src/modules/usuarios/controllers/usuariosController');

describe('Usuarios Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
  });

  test('listarUsuarios devuelve los usuarios en JSON', async () => {
    storage.leerUsuarios = jest.fn().mockResolvedValue([{ nombre: 'Ana' }]);
    await listarUsuarios(req, res);
    expect(res.json).toHaveBeenCalledWith([{ nombre: 'Ana' }]);
  });

  test('obtenerUsuario responde 404 si no existe', async () => {
    req.params.id = 'user-id';
    storage.buscarPorId = jest.fn().mockResolvedValue(null);
    await obtenerUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('crearUsuario rechaza email duplicado con 400', async () => {
    req.body = { email: 'ana@test.com' };
    storage.buscarPorEmail = jest.fn().mockResolvedValue({ _id: 'existe' });
    await crearUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('crearUsuario crea y responde 201 cuando el email es nuevo', async () => {
    req.body = { nombre: 'Ana', email: 'ana@test.com', contrasena: 'Password1!' };
    storage.buscarPorEmail = jest.fn().mockResolvedValue(null);
    storage.agregar = jest.fn().mockResolvedValue({ nombre: 'Ana', email: 'ana@test.com' });
    await crearUsuario(req, res);
    expect(storage.agregar).toHaveBeenCalledWith(expect.objectContaining({
      cambiarContrasena: true,
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('actualizarUsuario ignora cambios directos de contraseña', async () => {
    req.params.id = 'user-id';
    req.body = { nombre: 'Ana Actualizada', contrasena: 'texto-plano' };
    storage.buscarPorId = jest.fn().mockResolvedValue({ _id: 'user-id', email: 'ana@test.com' });
    storage.actualizar = jest.fn().mockResolvedValue({ nombre: 'Ana Actualizada' });

    await actualizarUsuario(req, res);

    expect(storage.actualizar).toHaveBeenCalledWith('user-id', { nombre: 'Ana Actualizada' });
  });

  test('eliminarUsuarioForm elimina y vuelve al panel', async () => {
    req.params.id = 'user-id';
    storage.eliminar = jest.fn().mockResolvedValue(true);

    await eliminarUsuarioForm(req, res);

    expect(storage.eliminar).toHaveBeenCalledWith('user-id');
    expect(res.redirect).toHaveBeenCalledWith('/usuarios/vista');
  });

  test('eliminarUsuario responde 404 si no existe', async () => {
    req.params.id = 'user-id';
    storage.eliminar = jest.fn().mockResolvedValue(null);
    await eliminarUsuario(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('eliminarUsuario elimina y responde ok', async () => {
    req.params.id = 'user-id';
    storage.eliminar = jest.fn().mockResolvedValue({ _id: 'user-id' });
    await eliminarUsuario(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('cambiarEstado actualiza y redirige a la vista', async () => {
    req.params.id = 'user-id';
    req.body = { estado: 'suspendido' };
    storage.actualizar = jest.fn().mockResolvedValue({});
    await cambiarEstado(req, res);
    expect(storage.actualizar).toHaveBeenCalledWith('user-id', { estado: 'suspendido' });
    expect(res.redirect).toHaveBeenCalledWith('/usuarios/vista');
  });
});
