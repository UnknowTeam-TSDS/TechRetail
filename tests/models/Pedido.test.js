const mongoose = require('mongoose');
const Pedido = require('../../src/modules/Pedidos/models/Pedido');

describe('Modelo Pedido - validaciones de schema', () => {
  const tiendaId = new mongoose.Types.ObjectId();

  const datosValidos = {
    tiendaId,
    items: [{ nombre: 'Remera', precioUnitario: 1500, cantidad: 2, subtotal: 3000 }],
    total: 3000,
    medioPago: 'mercadopago',
    comprador: { nombre: 'Ana Pérez', email: 'ana@email.com' },
  };

  test('es valido con datos minimos correctos', async () => {
    const pedido = new Pedido(datosValidos);
    await expect(pedido.validate()).resolves.toBeUndefined();
  });

  test('falla si falta el total', async () => {
    const pedido = new Pedido({ ...datosValidos, total: undefined });
    await expect(pedido.validate()).rejects.toThrow();
  });

  test('falla si el total es negativo', async () => {
    const pedido = new Pedido({ ...datosValidos, total: -100 });
    await expect(pedido.validate()).rejects.toThrow();
  });

  test('falla si el medio de pago no es del catalogo', async () => {
    const pedido = new Pedido({ ...datosValidos, medioPago: 'bitcoin' });
    await expect(pedido.validate()).rejects.toThrow();
  });

  test('falla si falta el medio de pago', async () => {
    const pedido = new Pedido({ ...datosValidos, medioPago: undefined });
    await expect(pedido.validate()).rejects.toThrow();
  });

  test('falla si falta el nombre del comprador', async () => {
    const pedido = new Pedido({ ...datosValidos, comprador: { email: 'ana@email.com' } });
    await expect(pedido.validate()).rejects.toThrow();
  });

  test('falla si el email del comprador no es valido', async () => {
    const pedido = new Pedido({ ...datosValidos, comprador: { nombre: 'Ana', email: 'no-es-email' } });
    await expect(pedido.validate()).rejects.toThrow();
  });

  test('acepta un medio de envio valido', async () => {
    const pedido = new Pedido({ ...datosValidos, medioEnvio: 'retiro_local' });
    await expect(pedido.validate()).resolves.toBeUndefined();
  });

  test('falla si el medio de envio no es del catalogo', async () => {
    const pedido = new Pedido({ ...datosValidos, medioEnvio: 'drone' });
    await expect(pedido.validate()).rejects.toThrow();
  });

  test('el estado por defecto es pendiente', () => {
    const pedido = new Pedido(datosValidos);
    expect(pedido.estado).toBe('pendiente');
  });

  test('esSimulado es true por defecto', () => {
    const pedido = new Pedido(datosValidos);
    expect(pedido.esSimulado).toBe(true);
  });

  test('medioEnvio es null por defecto', () => {
    const pedido = new Pedido(datosValidos);
    expect(pedido.medioEnvio).toBeNull();
  });
});
