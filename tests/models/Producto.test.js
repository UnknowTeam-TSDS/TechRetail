const mongoose = require('mongoose');
const Producto = require('../../src/modules/Productos/models/Producto');

describe('Modelo Producto - validaciones de schema', () => {
  const tiendaId = new mongoose.Types.ObjectId();
  const datosFisicosValidos = {
    tiendaId,
    nombre: 'Remera',
    precio: 1500,
    tipo: 'fisico',
    pesoKg: 0.5,
    dimensiones: { altoCm: 10, anchoCm: 20, largoCm: 30 },
  };

  test('falla si falta el nombre', async () => {
    const producto = new Producto({ tiendaId, precio: 100 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si el nombre tiene menos de 3 caracteres', async () => {
    const producto = new Producto({ ...datosFisicosValidos, nombre: 'AB' });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si falta el precio', async () => {
    const producto = new Producto({ ...datosFisicosValidos, precio: undefined });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si el precio es negativo', async () => {
    const producto = new Producto({ ...datosFisicosValidos, precio: -1 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si el stock es negativo', async () => {
    const producto = new Producto({ ...datosFisicosValidos, stock: -5 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('es valido con datos minimos correctos para producto fisico', async () => {
    const producto = new Producto(datosFisicosValidos);
    await expect(producto.validate()).resolves.toBeUndefined();
  });

  test('falla si un producto fisico no tiene peso', async () => {
    const producto = new Producto({ ...datosFisicosValidos, pesoKg: undefined });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si un producto fisico no tiene dimensiones', async () => {
    const producto = new Producto({ ...datosFisicosValidos, dimensiones: undefined });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('acepta producto digital sin peso ni dimensiones', async () => {
    const producto = new Producto({ tiendaId, nombre: 'Ebook', precio: 500, tipo: 'digital' });
    await expect(producto.validate()).resolves.toBeUndefined();
  });

  test('el stock por defecto es 0', () => {
    const producto = new Producto(datosFisicosValidos);
    expect(producto.stock).toBe(0);
  });

  test('activo es true por defecto', () => {
    const producto = new Producto(datosFisicosValidos);
    expect(producto.activo).toBe(true);
  });

  test('acepta precio igual a 0', async () => {
    const producto = new Producto({ ...datosFisicosValidos, nombre: 'Muestra gratis', precio: 0 });
    await expect(producto.validate()).resolves.toBeUndefined();
  });

  test('el tipo por defecto es fisico', () => {
    const producto = new Producto(datosFisicosValidos);
    expect(producto.tipo).toBe('fisico');
  });

  test('falla si el tipo no es un valor valido', async () => {
    const producto = new Producto({ ...datosFisicosValidos, tipo: 'invalido' });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si precioPromocional es negativo', async () => {
    const producto = new Producto({ ...datosFisicosValidos, precioPromocional: -100 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si precioPromocional no es menor al precio habitual', async () => {
    const producto = new Producto({ ...datosFisicosValidos, precioPromocional: 1600 });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('acepta precioPromocional valido', async () => {
    const producto = new Producto({ ...datosFisicosValidos, precioPromocional: 990 });
    await expect(producto.validate()).resolves.toBeUndefined();
  });

  test('destacado, esNovedad y esOferta son false por defecto', () => {
    const producto = new Producto(datosFisicosValidos);
    expect(producto.destacado).toBe(false);
    expect(producto.esNovedad).toBe(false);
    expect(producto.esOferta).toBe(false);
  });

  test('falla si tituloSEO supera 70 caracteres', async () => {
    const titulo = 'a'.repeat(71);
    const producto = new Producto({ ...datosFisicosValidos, tituloSEO: titulo });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('falla si descripcionSEO supera 160 caracteres', async () => {
    const desc = 'a'.repeat(161);
    const producto = new Producto({ ...datosFisicosValidos, descripcionSEO: desc });
    await expect(producto.validate()).rejects.toThrow();
  });

  test('acepta tags como array de strings', async () => {
    const producto = new Producto({ ...datosFisicosValidos, tags: ['algodon', 'mujer'] });
    await expect(producto.validate()).resolves.toBeUndefined();
    expect(producto.tags).toHaveLength(2);
  });

  test('acepta imagenes como array de URLs', async () => {
    const producto = new Producto({
      ...datosFisicosValidos,
      imagenes: ['https://ejemplo.com/foto.jpg'],
    });
    await expect(producto.validate()).resolves.toBeUndefined();
    expect(producto.imagenes).toHaveLength(1);
  });
});
