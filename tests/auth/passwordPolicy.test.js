const { validarContrasenaSegura } = require('../../src/modules/Auth/passwordPolicy');

describe('validarContrasenaSegura', () => {
  test('acepta una contraseña que cumple todos los requisitos', () => {
    expect(validarContrasenaSegura('Segura123!')).toBeNull();
  });

  test('rechaza si tiene menos de 8 caracteres', () => {
    expect(validarContrasenaSegura('Ab1!')).toMatch(/8 caracteres/);
  });

  test('rechaza si no tiene minúscula', () => {
    expect(validarContrasenaSegura('SEGURA123!')).toMatch(/minúscula/);
  });

  test('rechaza si no tiene mayúscula', () => {
    expect(validarContrasenaSegura('segura123!')).toMatch(/mayúscula/);
  });

  test('rechaza si no tiene número', () => {
    expect(validarContrasenaSegura('SeguraClave!')).toMatch(/número/);
  });

  test('rechaza si no tiene símbolo', () => {
    expect(validarContrasenaSegura('Segura1234')).toMatch(/símbolo/);
  });

  test('rechaza vacío o nulo', () => {
    expect(validarContrasenaSegura('')).toMatch(/8 caracteres/);
    expect(validarContrasenaSegura(undefined)).toMatch(/8 caracteres/);
  });

  test('acepta varios símbolos válidos', () => {
    expect(validarContrasenaSegura('Pass1@word')).toBeNull();
    expect(validarContrasenaSegura('Pass1#word')).toBeNull();
    expect(validarContrasenaSegura('Pass1$word')).toBeNull();
  });
});
