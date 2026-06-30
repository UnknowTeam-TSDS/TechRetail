const mongoose = require('mongoose');
const Tienda = require('../../src/modules/Tienda/models/Tienda');

describe('Modelo Tienda - validaciones de schema', () => {
  const usuarioId = new mongoose.Types.ObjectId();

  const datosValidos = {
    usuarioId,
    nombre: 'Mi Tienda',
    rubro: 'moda',
    emailContacto: 'contacto@minegoicio.com',
    telefono: '+54 9 11 1234-5678',
    direccion: 'Av. Corrientes 1234, CABA',
  };

  test('falla si falta el nombre', async () => {
    const tienda = new Tienda({ ...datosValidos, nombre: undefined });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el nombre tiene menos de 3 caracteres', async () => {
    const tienda = new Tienda({ ...datosValidos, nombre: 'AB' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si falta el rubro', async () => {
    const tienda = new Tienda({ ...datosValidos, rubro: undefined });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el rubro no es valido', async () => {
    const tienda = new Tienda({ ...datosValidos, rubro: 'tecnologia' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el color no es un hex valido', async () => {
    const tienda = new Tienda({ ...datosValidos, colorPrimario: 'rojo' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el estado no es valido', async () => {
    const tienda = new Tienda({ ...datosValidos, estado: 'publicada' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si falta el emailContacto', async () => {
    const tienda = new Tienda({ ...datosValidos, emailContacto: undefined });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el emailContacto no tiene formato valido', async () => {
    const tienda = new Tienda({ ...datosValidos, emailContacto: 'no-es-un-email' });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si falta el telefono', async () => {
    const tienda = new Tienda({ ...datosValidos, telefono: undefined });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si falta la direccion', async () => {
    const tienda = new Tienda({ ...datosValidos, direccion: undefined });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('es valida con todos los datos obligatorios', async () => {
    const tienda = new Tienda(datosValidos);
    await expect(tienda.validate()).resolves.toBeUndefined();
  });

  test('el estado por defecto es en_construccion', () => {
    const tienda = new Tienda(datosValidos);
    expect(tienda.estado).toBe('en_construccion');
  });

  test('el color por defecto es #1D4ED8', () => {
    const tienda = new Tienda(datosValidos);
    expect(tienda.colorPrimario).toBe('#1D4ED8');
  });

  test('whatsapp es opcional y por defecto vacio', () => {
    const tienda = new Tienda(datosValidos);
    expect(tienda.whatsapp).toBe('');
  });

  test('acepta todos los rubros validos', async () => {
    const rubros = ['moda', 'electronica', 'hogar', 'alimentos', 'servicios', 'otro'];
    for (const rubro of rubros) {
      const tienda = new Tienda({ ...datosValidos, rubro });
      await expect(tienda.validate()).resolves.toBeUndefined();
    }
  });

  test('mediosPago y mediosEnvio por defecto son arreglos vacios', () => {
    const tienda = new Tienda(datosValidos);
    expect(tienda.mediosPago).toEqual([]);
    expect(tienda.mediosEnvio).toEqual([]);
  });

  test('acepta medios de pago validos', async () => {
    const tienda = new Tienda({ ...datosValidos, mediosPago: ['mercadopago', 'transferencia'] });
    await expect(tienda.validate()).resolves.toBeUndefined();
  });

  test('falla si un medio de pago no es valido', async () => {
    const tienda = new Tienda({ ...datosValidos, mediosPago: ['bitcoin'] });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('acepta medios de envio validos', async () => {
    const tienda = new Tienda({ ...datosValidos, mediosEnvio: ['retiro_local', 'envio_gratis'] });
    await expect(tienda.validate()).resolves.toBeUndefined();
  });

  test('falla si un medio de envio no es valido', async () => {
    const tienda = new Tienda({ ...datosValidos, mediosEnvio: ['drone'] });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('falla si el monto de envio gratis es negativo', async () => {
    const tienda = new Tienda({ ...datosValidos, envioGratisMonto: -100 });
    await expect(tienda.validate()).rejects.toThrow();
  });

  test('acepta un monto de envio gratis valido', async () => {
    const tienda = new Tienda({ ...datosValidos, envioGratisMonto: 50000 });
    await expect(tienda.validate()).resolves.toBeUndefined();
  });
});
