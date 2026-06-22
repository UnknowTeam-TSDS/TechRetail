const mongoose = require('mongoose');
const Producto = require('../../src/modules/Productos/models/Producto');

describe('Modelo Producto - validaciones de schema', () => {
  const tiendaId = new mongoose.Types.ObjectId();

  test('falla si falta el nombre', async () => {
    const producto = new Producto({ tiendaId, precio: 100 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si el nombre tiene menos de 3 caracteres', async () => {
    const producto = new Producto({ tiendaId, nombre: 'AB', precio: 100 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si falta el precio', async () => {
    const producto = new Producto({ tiendaId, nombre: 'Remera' });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si el precio es negativo', async () => {
    const producto = new Producto({ tiendaId, nombre: 'Remera', precio: -1 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si el stock es negativo', async () => {
    const producto = new Producto({ tiendaId, nombre: 'Remera', precio: 100, stock: -5 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('es valido con datos minimos correctos', async () => {
    const producto = new Producto({ tiendaId, nombre: 'Remera', precio: 1500 });
    await expect(producto.validate()).resolves.toBeUndefined();
  });

  test('el stock por defecto es 0', () => {
    const producto = new Producto({ tiendaId, nombre: 'Remera', precio: 1500 });
    expect(producto.stock).toBe(0);
  });

  test('activo es true por defecto', () => {
    const producto = new Producto({ tiendaId, nombre: 'Remera', precio: 1500 });
    expect(producto.activo).toBe(true);
  });

  test('acepta precio igual a 0', async () => {
    const producto = new Producto({ tiendaId, nombre: 'Muestra gratis', precio: 0 });
    await expect(producto.validate()).resolves.toBeUndefined();
  });
});
