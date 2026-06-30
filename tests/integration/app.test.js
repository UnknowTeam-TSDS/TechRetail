/*
  Tests de integración: levantan la app real contra una MongoDB en memoria
  (mongodb-memory-server) y prueban rutas end-to-end con supertest, incluyendo
  middlewares, sesiones y renderizado. Complementan los tests unitarios con mocks.
*/
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app, mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  // Variables que la app espera; se setean antes de requerir app.js.
  process.env.MONGO_URI = mongo.getUri();
  process.env.SESSION_SECRET = 'secret-de-test';
  process.env.NODE_ENV = 'test';
  await mongoose.connect(mongo.getUri());
  app = require('../../app');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  // Limpia las colecciones entre tests para evitar interferencias.
  const colecciones = mongoose.connection.collections;
  for (const nombre in colecciones) {
    await colecciones[nombre].deleteMany({});
  }
});

describe('Rutas públicas y de sesión', () => {
  test('GET /login responde 200 con HTML', async () => {
    const res = await request(app).get('/login');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('GET / sin sesión redirige a /login', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('GET /mi-tienda sin sesión redirige a /login', async () => {
    const res = await request(app).get('/mi-tienda');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('GET /api/usuarios sin sesión redirige a /login', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(302);
  });

  test('ruta web inexistente responde 404 con HTML', async () => {
    const res = await request(app).get('/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('ruta /api inexistente responde 404 con JSON', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test('una tienda con id malformado responde 404 (validarObjectId)', async () => {
    const res = await request(app).get('/tienda/id-invalido');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

describe('Flujo de registro y login de cliente', () => {
  test('registro, login y acceso a mi-cuenta con la sesión activa', async () => {
    // El agente persiste la cookie de sesión entre requests.
    const agent = request.agent(app);

    const registro = await agent.post('/registro').type('form').send({
      nombre: 'Cliente Test',
      email: 'cliente@test.com',
      contrasena: 'Password1!',
    });
    expect(registro.status).toBe(302);
    expect(registro.headers.location).toMatch(/\/login/);

    const login = await agent.post('/login').type('form').send({
      email: 'cliente@test.com',
      contrasena: 'Password1!',
    });
    expect(login.status).toBe(302);
    // Cliente recién registrado, sin plan → va a elegir plan
    expect(login.headers.location).toBe('/elegir-plan');

    const cuenta = await agent.get('/mi-cuenta');
    expect(cuenta.status).toBe(200);
    expect(cuenta.headers['content-type']).toMatch(/html/);
  });

  test('POST /login con contraseña incorrecta responde 401', async () => {
    await request(app).post('/registro').type('form').send({
      nombre: 'Otro Cliente',
      email: 'otro@test.com',
      contrasena: 'Password1!',
    });

    const res = await request(app).post('/login').type('form').send({
      email: 'otro@test.com',
      contrasena: 'incorrecta',
    });
    expect(res.status).toBe(401);
  });
});
