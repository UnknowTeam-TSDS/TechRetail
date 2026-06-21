const Usuario = require('../../src/modules/usuarios/models/Usuario');

describe('Modelo Usuario - validaciones de schema', () => {
  test('falla si falta el nombre', async () => {
    const usuario = new Usuario({ email: 'test@test.com', contrasena: '123456' });
    await expect(usuario.validate()).rejects.toThrow();
  });

  test('falla si el nombre tiene menos de 3 caracteres', async () => {
    const usuario = new Usuario({ nombre: 'AB', email: 'test@test.com', contrasena: '123456' });
    await expect(usuario.validate()).rejects.toThrow();
  });

  test('falla si falta el email', async () => {
    const usuario = new Usuario({ nombre: 'Test User', contrasena: '123456' });
    await expect(usuario.validate()).rejects.toThrow();
  });

  test('falla si el email tiene formato invalido', async () => {
    const usuario = new Usuario({ nombre: 'Test User', email: 'no-es-un-email', contrasena: '123456' });
    await expect(usuario.validate()).rejects.toThrow();
  });

  test('falla si la contrasena tiene menos de 6 caracteres', async () => {
    const usuario = new Usuario({ nombre: 'Test User', email: 'test@test.com', contrasena: '123' });
    await expect(usuario.validate()).rejects.toThrow();
  });

  test('falla si el rol no es "admin" ni "cliente"', async () => {
    const usuario = new Usuario({ nombre: 'Test User', email: 'test@test.com', contrasena: '123456', rol: 'superadmin' });
    await expect(usuario.validate()).rejects.toThrow();
  });

  test('falla si el estado no es valido', async () => {
    const usuario = new Usuario({ nombre: 'Test User', email: 'test@test.com', contrasena: '123456', estado: 'bloqueado' });
    await expect(usuario.validate()).rejects.toThrow();
  });

  test('es valido con datos minimos correctos', async () => {
    const usuario = new Usuario({ nombre: 'Leandro Melchiori', email: 'leandro@empresa.com', contrasena: '123456' });
    await expect(usuario.validate()).resolves.toBeUndefined();
  });

  test('acepta los tres estados validos', async () => {
    for (const estado of ['activo', 'inactivo', 'suspendido']) {
      const usuario = new Usuario({ nombre: 'Test User', email: `test-${estado}@test.com`, contrasena: '123456', estado });
      await expect(usuario.validate()).resolves.toBeUndefined();
    }
  });
});
