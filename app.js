/*
  TechRetail Solutions S.R.L.
  Plataforma SaaS de E-Commerce para PyMEs y Emprendedores Digitales en Argentina

  Grupo 13: Melchiori, Zarate, Navarro, Choque, Basarab

  Entrega Final - Backend con MongoDB Atlas y variables de entorno
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const logger = require('./src/middlewares/logger');
const { conectarMongoDB } = require('./src/config/mongodb');
const session = require('express-session');
const { verificarSesion, verificarAdmin } = require('./src/middlewares/autenticacion');
const planesRouter = require('./src/modules/Planes/routers/planesRouter');
const usuariosRouter = require('./src/modules/usuarios/routers/usuariosRouter');
const tiendaRouter = require('./src/modules/Tienda/routers/tiendaRouter');
const productosRouter = require('./src/modules/Productos/routers/productosRouter');
const Usuario = require('./src/modules/usuarios/models/Usuario');
const Plan = require('./src/modules/Planes/models/Plan');
const Tienda = require('./src/modules/Tienda/models/Tienda');
const Producto = require('./src/modules/Productos/models/Producto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PUERTO = process.env.PORT || 3000;

// Guardar io en app para usarlo desde los controllers via req.app.get('io')
app.set('io', io);

// ── Motor de plantillas Pug ──────────────────────────────────────────────────
app.set('view engine', 'pug');
app.set('views', [
  path.join(__dirname, 'src/views'),                              // views index + layout compartido
  path.join(__dirname, 'src/modules/Planes/views'),               // views modulo planes
  path.join(__dirname, 'src/modules/usuarios/views'),             // views modulo usuarios
  path.join(__dirname, 'src/modules/Auth/views'),                 // views autenticacion
  path.join(__dirname, 'src/modules/Tienda/views'),               // views modulo tienda
  path.join(__dirname, 'src/modules/Productos/views'),            // views modulo productos
]);

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'))); // Archivos estáticos (imágenes subidas)
app.use(express.json());                         // Parsear body JSON en requests POST/PUT
app.use(express.urlencoded({ extended: true })); // Parsear form data
app.use(logger);                                 // Logger: registra cada request

// ── Configuración de sesiones ───────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    httpOnly: true,
    secure: false, // cambiar a true si usas HTTPS
  }
}));

// Middleware: pasar usuario logueado a las vistas
app.use((req, res, next) => {
  res.locals.usuarioLogueado = req.session.usuario || null;
  next();
});

// ── Dashboard Admin (PROTEGIDA) ──────────────────────────────────────────────
app.get('/', verificarAdmin, async (req, res) => {
  try {
    const ahora = new Date();
    const [totalClientes, activos, inactivos, suspendidos, enTrial, totalPlanes, totalAddons, totalTiendas, totalProductos, usuariosActivos, todosClientes, recientes] = await Promise.all([
      Usuario.countDocuments({ rol: 'cliente' }),
      Usuario.countDocuments({ rol: 'cliente', estado: 'activo' }),
      Usuario.countDocuments({ rol: 'cliente', estado: 'inactivo' }),
      Usuario.countDocuments({ rol: 'cliente', estado: 'suspendido' }),
      Usuario.countDocuments({ rol: 'cliente', trialHasta: { $gt: ahora } }),
      Plan.countDocuments({ tipo: 'plan' }),
      Plan.countDocuments({ tipo: 'addon' }),
      Tienda.countDocuments(),
      Producto.countDocuments(),
      Usuario.find({ rol: 'cliente', estado: 'activo' }),
      Usuario.find({ rol: 'cliente' }),
      Usuario.find({ rol: 'cliente' }).sort({ fechaRegistro: -1 }).limit(5),
    ]);

    const mrr = usuariosActivos.reduce((sum, u) => {
      const enTrialU = u.trialHasta && u.trialHasta > ahora;
      return sum + (!enTrialU && u.planId ? u.planId.precio : 0);
    }, 0);

    const addonsContratados = todosClientes.reduce((sum, u) => sum + (u.addons?.length || 0), 0);

    const distribucion = {};
    todosClientes.forEach(u => {
      const nombre = u.planId?.nombre || (u.trialHasta && u.trialHasta > ahora ? 'Trial' : 'Sin plan');
      distribucion[nombre] = (distribucion[nombre] || 0) + 1;
    });

    res.render('index', {
      titulo: 'Panel de Gestión',
      stats: { totalClientes, activos, inactivos, suspendidos, enTrial, totalPlanes, totalAddons, mrr, addonsContratados, totalTiendas, totalProductos },
      distribucion,
      recientes,
    });
  } catch (error) {
    res.render('index', { titulo: 'Panel de Gestión', stats: null, distribucion: {}, recientes: [] });
  }
});

// ── Router de Autenticación ──────────────────────────────────────────────────
const authRouter = require('./src/modules/Auth/routers/authRouter');
app.use('/', authRouter);  // GET /login, POST /login, POST /logout

// ── Montaje de routers (PROTEGIDOS) ──────────────────────────────────────────
app.use('/api/planes', verificarAdmin, planesRouter);      // Proteger API
app.use('/api/usuarios', verificarAdmin, usuariosRouter);  // Proteger API
app.use('/planes', verificarAdmin, planesRouter);          // Proteger vistas
app.use('/usuarios', verificarAdmin, usuariosRouter);      // Proteger vistas
app.use('/', tiendaRouter);                                // GET/POST /mi-tienda
app.use('/', productosRouter);                             // GET/POST /mis-productos

// ── Manejo de rutas no encontradas (404) ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada.`,
  });
});

// ── Manejo global de errores ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    ok: false,
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ── WebSockets con Socket.io ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`  Socket conectado: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`  Socket desconectado: ${socket.id}`);
  });
});

// ── Inicio del servidor ──────────────────────────────────────────────────────
const iniciarServidor = async () => {
  // Conectar a MongoDB primero
  await conectarMongoDB();

  server.listen(PUERTO, () => {
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
        console.log('  Módulo Autenticacion:');
    console.log(`   Vista:    http://localhost:${PUERTO}/login`);
    console.log('');
  });
};

iniciarServidor();