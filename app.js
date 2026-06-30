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
const pedidosRouter = require('./src/modules/Pedidos/routers/pedidosRouter');
const Usuario = require('./src/modules/usuarios/models/Usuario');
const Plan = require('./src/modules/Planes/models/Plan');
const Tienda = require('./src/modules/Tienda/models/Tienda');
const Producto = require('./src/modules/Productos/models/Producto');
const Pedido = require('./src/modules/Pedidos/models/Pedido');

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
  path.join(__dirname, 'src/modules/Pedidos/views'),              // views modulo pedidos
]);

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'))); // Archivos estáticos (imágenes subidas)
app.use(express.json());                         // Parsear body JSON en requests POST/PUT
app.use(express.urlencoded({ extended: true })); // Parsear form data
app.use(logger);                                 // Logger: registra cada request

// En producción la app corre detrás del proxy de Render (HTTPS). Esto permite
// que la cookie 'secure' viaje correctamente al estar detrás del proxy.
const enProduccion = process.env.NODE_ENV === 'production';
if (enProduccion) app.set('trust proxy', 1);

// ── Configuración de sesiones ───────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    httpOnly: true,              // la cookie no es accesible desde JS (mitiga XSS)
    secure: enProduccion,        // solo viaja por HTTPS en producción
    sameSite: 'lax',             // mitiga CSRF: no se envía en POST cross-site
  }
}));

// Middleware: pasar usuario logueado a las vistas
app.use((req, res, next) => {
  res.locals.usuarioLogueado = req.session.usuario || null;
  next();
});

// Middleware flash: mensaje de un solo uso que sobrevive al redirect (patrón PRG).
// Un controller setea req.session.flash y la siguiente vista lo recibe en res.locals.flash.
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// ── Dashboard Admin (PROTEGIDA) ──────────────────────────────────────────────
// Root según rol: anónimo → login, cliente → su panel, admin → dashboard
app.get('/', (req, res, next) => {
  if (!req.session.usuario) return res.redirect('/login');
  if (req.session.usuario.rol !== 'admin') return res.redirect('/mi-cuenta');
  next();
}, async (req, res) => {
  try {
    const ahora = new Date();
    const [totalClientes, activos, inactivos, suspendidos, enTrial, totalPlanes, totalAddons, totalTiendas, tiendasPublicadas, tiendasBorrador, tiendasInactivas, totalProductos, totalPedidos, usuariosActivos, todosClientes, recientes] = await Promise.all([
      Usuario.countDocuments({ rol: 'cliente' }),
      Usuario.countDocuments({ rol: 'cliente', estado: 'activo' }),
      Usuario.countDocuments({ rol: 'cliente', estado: 'inactivo' }),
      Usuario.countDocuments({ rol: 'cliente', estado: 'suspendido' }),
      Usuario.countDocuments({ rol: 'cliente', trialHasta: { $gt: ahora } }),
      Plan.countDocuments({ tipo: 'plan' }),
      Plan.countDocuments({ tipo: 'addon' }),
      Tienda.countDocuments(),
      Tienda.countDocuments({ estado: 'activa' }),
      Tienda.countDocuments({ estado: 'en_construccion' }),
      Tienda.countDocuments({ estado: 'inactiva' }),
      Producto.countDocuments(),
      Pedido.countDocuments(),
      Usuario.find({ rol: 'cliente', estado: 'activo' }),
      Usuario.find({ rol: 'cliente' }),
      Usuario.find({ rol: 'cliente' }).sort({ fechaRegistro: -1 }).limit(5),
    ]);

    const mrr = usuariosActivos.reduce((sum, u) => {
      const enTrialU = u.trialHasta && u.trialHasta > ahora;
      return sum + (!enTrialU && u.planId ? u.planId.precio : 0);
    }, 0);

    const addonsContratados = todosClientes.reduce((sum, u) => sum + (u.addons?.length || 0), 0);

    // RF-02 (Alertas de churn): clientes con señales de abandono o riesgo de baja.
    // Se prioriza un solo motivo por cliente, del más grave al más leve.
    const enRiesgo = todosClientes.reduce((lista, u) => {
      const trialVencido = u.trialHasta && u.trialHasta < ahora;
      const enTrialU = u.trialHasta && u.trialHasta > ahora;
      let motivo = null;
      if (u.estado === 'suspendido') motivo = 'Suspendido';
      else if (u.estado === 'inactivo') motivo = 'Inactivo';
      else if (trialVencido) motivo = 'Prueba vencida';
      else if (!u.planId && !enTrialU) motivo = 'Sin plan elegido';
      if (motivo) lista.push({ nombre: u.nombre, email: u.email, motivo });
      return lista;
    }, []);

    // Un cliente en prueba gratuita se cuenta como tal (aún no paga su plan),
    // coherente con el MRR. Al terminar el trial pasa a contar en su plan.
    const distribucion = {};
    todosClientes.forEach(u => {
      const enTrialU = u.trialHasta && u.trialHasta > ahora;
      const nombre = enTrialU ? 'Prueba gratuita' : (u.planId?.nombre || 'Sin plan');
      distribucion[nombre] = (distribucion[nombre] || 0) + 1;
    });

    res.render('index', {
      titulo: 'Panel de Gestión',
      stats: { totalClientes, activos, inactivos, suspendidos, enTrial, totalPlanes, totalAddons, mrr, addonsContratados, totalTiendas, tiendasPublicadas, tiendasBorrador, tiendasInactivas, totalProductos, totalPedidos },
      distribucion,
      recientes,
      enRiesgo,
    });
  } catch (error) {
    res.render('index', { titulo: 'Panel de Gestión', stats: null, distribucion: {}, recientes: [], enRiesgo: [] });
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
app.use('/', pedidosRouter);                               // checkout, confirmación, /mis-pedidos

// ── Manejo de rutas no encontradas (404) ─────────────────────────────────────
// Las rutas /api responden JSON (las consume Postman); el resto, una página con estilo.
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      ok: false,
      mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada.`,
    });
  }
  res.status(404).render('error', {
    codigo: 404,
    titulo: 'Página no encontrada',
    mensaje: 'La página que buscás no existe o fue movida.',
  });
});

// ── Manejo global de errores ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
  res.status(500).render('error', {
    codigo: 500,
    titulo: 'Algo salió mal',
    mensaje: 'Tuvimos un problema procesando tu pedido. Probá de nuevo en unos minutos.',
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
// Se exporta `app` para los tests de integración (supertest). El servidor solo
// arranca y se conecta a Mongo cuando el archivo se ejecuta directamente
// (`node app.js`), no cuando se importa desde un test.
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

if (require.main === module) {
  iniciarServidor();
}

module.exports = app;
