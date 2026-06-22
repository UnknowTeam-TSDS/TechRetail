const mongoose = require('mongoose');
const Tienda = require('../../src/modules/Tienda/models/Tienda');

describe('Modelo Tienda - validaciones de schema', () => {
  const usuarioId = new mongoose.Types.ObjectId();

  test('falla si falta el nombre', async () => {
    const tienda = new Tienda({ usuarioId, rubro: 'moda' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el nombre tiene menos de 3 caracteres', async () => {
    const tienda = new Tienda({ usuarioId, nombre: 'AB', rubro: 'moda' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si falta el rubro', async () => {
    const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el rubro no es valido', async () => {
    const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda', rubro: 'tecnologia' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el color no es un hex valido', async () => {
    const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda', rubro: 'moda', colorPrimario: 'rojo' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el estado no es valido', async () => {
    const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda', rubro: 'moda', estado: 'publicada' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('es valida con datos minimos correctos', async () => {
    const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda', rubro: 'moda' });
    await expect(tienda.validate()).resolves.toBeUndefined();
  });

  test('el estado por defecto es en_construccion', () => {
    const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda', rubro: 'moda' });
    expect(tienda.estado).toBe('en_construccion');
  });

  test('el color por defecto es #1D4ED8', () => {
    const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda', rubro: 'moda' });
    expect(tienda.colorPrimario).toBe('#1D4ED8');
  });

  test('acepta todos los rubros validos', async () => {
    const rubros = ['moda', 'electronica', 'hogar', 'alimentos', 'servicios', 'otro'];
    for (const rubro of rubros) {
      const tienda = new Tienda({ usuarioId, nombre: 'Mi Tienda', rubro });
      await expect(tienda.validate()).resolves.toBeUndefined();
    }
  });
});
