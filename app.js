/*
  TechRetail Solutions S.R.L.
  Plataforma SaaS de E-Commerce para PyMEs y Emprendedores Digitales en Argentina
 
  Grupo 13: Melchiori, Zarate, Navarro, Choque
  
  PFO1
 */

const express = require('express');
const path = require('path');
const logger = require('./src/middlewares/logger');
const planesRouter = require('./src/modules/Planes/routers/planesRouter');
const usuariosRouter = require('./src/modules/usuarios/routers/usuariosRouter');

const app = express();
const PUERTO = 3000;

// ── Motor de plantillas Pug ──────────────────────────────────────────────────
app.set('view engine', 'pug');
app.set('views', [
  path.join(__dirname, 'src/views'),                              // views index + layout compartido
  path.join(__dirname, 'src/modules/Planes/views'),               // views modulo planes
  path.join(__dirname, 'src/modules/usuarios/views'),             // views modulo usuarios
]);

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(express.json());                         // Parsear body JSON en requests POST/PUT
app.use(express.urlencoded({ extended: true })); // Parsear form data
app.use(logger);                                 // Logger: registra cada request

// ── Ruta raíz — Vista principal ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Panel de Gestión' });
});

// ── Montaje de routers ──────────────────────────────────────────────────── ───
app.use('/api/planes', planesRouter);         // API         - Planes
app.use('/api/usuarios', usuariosRouter);     // API         - Usuarios
app.use('/planes', planesRouter);             // Vistas HTML - Planes
app.use('/usuarios', usuariosRouter);         // Vistas HTML - Usuarios

// ── Manejo de rutas no encontradas (404) ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada.`,
  });
});

// ── Inicio del servidor ──────────────────────────────────────────────────────
app.listen(PUERTO, () => {
  console.log('');
  console.log('  TechRetail Solutions S.R.L.');
  console.log(`  Servidor corriendo en http://localhost:${PUERTO}`);
  console.log('');
  console.log('  Módulo Planes:');
  console.log(`   Vista:    http://localhost:${PUERTO}/planes/vista`);
  console.log(`   API REST: http://localhost:${PUERTO}/api/planes`);
  console.log('');
  console.log('  Módulo Usuarios:');
  console.log(`   Vista:    http://localhost:${PUERTO}/usuarios/vista`);
  console.log(`   API REST: http://localhost:${PUERTO}/api/usuarios`);
  console.log('');
});
