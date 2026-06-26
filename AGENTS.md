# TechRetail Solutions S.R.L. — AGENTS.md

## Contexto del proyecto

Trabajo práctico de la **Entrega Final** de la materia **Desarrollo Web Backend** (Técnicatura en Programación, IFST 29).

El proyecto está basado en el relevamiento de empresa que el mismo grupo (Grupo 13) entregó para **Ingeniería de Software** (PFO1). La empresa ficticia es **TechRetail Solutions S.R.L.**, una plataforma SaaS de e-commerce para PyMEs y emprendedores digitales en Argentina.

**El backend implementa:**
- Panel de administración interno (gestión de planes, clientes, métricas)
- Panel de cliente (mi cuenta, tienda propia, catálogo de productos)

El 3° parcial/entrega final **permite módulos extra** siempre que se documenten y justifiquen. Los módulos Tienda y Productos fueron agregados por eso.

### Grupo 13 — Comisión E

| Integrante | Rol en IS |
|------------|-----------|
| Melchiori Leandro (usuario) | Squad UX/Prod — Onboarding guiado (RF-05) |
| Navarro Javier | Squad Pagos — Checkout (RF-01) |
| Zárate Carlos | Squad Monitoreo — Alertas churn (RF-02) |
| Choque Heber | Squad Finanzas — Conciliación (RF-03) |
| Basarab Lautaro | Squad Logística — Integración logística (RF-04) |

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Framework | Express 5.x |
| Base de datos | MongoDB Atlas + Mongoose 9.x |
| Autenticación | express-session + bcryptjs |
| Vistas | Pug 3.x + Tailwind CSS (CDN) |
| Uploads | multer (imágenes a `public/uploads/`) |
| Dev | nodemon |
| Tests | Jest |

---

## Cómo correr el proyecto

```bash
npm run dev    # nodemon, recarga automática
npm start      # node app.js
npm test       # jest --forceExit
```

Servidor en: `http://localhost:3000`

**Credenciales por defecto** (se crean automáticamente con el seed):
- Email: `admin@techretail.com`
- Password: `123456`

El seed crea automáticamente 3 planes (Starter $15.000, Growth $45.000, Pro $80.000), 4 add-ons y el usuario admin si la base está vacía.

---

## Arquitectura

Patrón **MVC modular**: cada módulo tiene su propia carpeta con router → controller → storage → model → views.

```
TechRetail/
├── app.js
├── public/
│   └── uploads/productos/          # Imágenes subidas con multer (no committeadas)
├── src/
│   ├── config/
│   │   ├── mongodb.js
│   │   ├── multer.js               # Configuración multer (diskStorage, 5MB, solo imágenes)
│   │   └── seed.js
│   ├── middlewares/
│   │   ├── autenticacion.js        # verificarSesion(), verificarAdmin()
│   │   └── logger.js
│   ├── modules/
│   │   ├── Auth/                   # Login / Logout / Mi cuenta / Mis add-ons
│   │   │   ├── controllers/authController.js
│   │   │   ├── routers/authRouter.js
│   │   │   └── views/
│   │   │       ├── login.pug
│   │   │       ├── mi-cuenta.pug   # Panel del cliente: plan, add-ons, trial
│   │   │       └── registro.pug
│   │   ├── Planes/                 # CRUD planes y add-ons (admin)
│   │   │   ├── controllers/planesController.js
│   │   │   ├── routers/planesRouter.js
│   │   │   ├── storage/planesStorage.js
│   │   │   ├── models/Plan.js
│   │   │   └── views/planes.pug
│   │   ├── Tienda/                 # Configuración de tienda por cliente
│   │   │   ├── controllers/tiendaController.js
│   │   │   ├── routers/tiendaRouter.js
│   │   │   ├── storage/tiendaStorage.js
│   │   │   ├── models/Tienda.js
│   │   │   └── views/mi-tienda.pug
│   │   ├── Productos/              # Catálogo de productos por tienda
│   │   │   ├── controllers/productosController.js
│   │   │   ├── routers/productosRouter.js
│   │   │   ├── storage/productosStorage.js
│   │   │   ├── models/Producto.js
│   │   │   └── views/mis-productos.pug
│   │   └── usuarios/               # CRUD usuarios/clientes (admin)
│   │       ├── controllers/usuariosController.js
│   │       ├── routers/usuariosRouter.js
│   │       ├── storage/usuariosStorage.js
│   │       ├── models/Usuario.js
│   │       └── views/usuarios.pug
│   └── views/
│       ├── layout.pug
│       └── index.pug               # Dashboard admin
└── tests/
    ├── controllers/
    └── models/
```

---

## Módulos

### Auth
- `GET /login` — Formulario de login
- `POST /login` — Valida con bcrypt, crea sesión → redirige según rol
- `POST /logout` — Destruye sesión
- `GET /mi-cuenta` — Panel del cliente: plan activo, add-ons disponibles/contratados, trial
- `POST /mis-addons/agregar` — Contrata un add-on (requiere plan pago, no trial)

### Planes (`/planes` y `/api/planes`) — solo admin
Schema Plan: `nombre` (req, min 3), `descripcion` (req), `precio` (req, ≥0), `tipo` (enum: `'plan'|'addon'`), `activo` (bool), timestamps.

### Usuarios (`/usuarios` y `/api/usuarios`) — solo admin
Schema Usuario: `nombre` (req, min 3), `email` (req, único), `contrasena` (req, min 6, hashed, `select:false`), `empresa`, `telefono`, `planId` (ref Plan), `rol` (enum: `'admin'|'cliente'`), `estado` (enum: `'activo'|'inactivo'|'suspendido'`), `trialHasta` (Date), `addons` (array ref Plan), timestamps.

### Tienda (`/mi-tienda`) — cliente autenticado
Una tienda por usuario (`usuarioId: unique`). Upsert con `findOneAndUpdate`.

Schema Tienda: `nombre` (req, min 3), `descripcion`, `rubro` (enum req), `colorPrimario` (hex), `emailContacto` (req), `telefono` (req), `direccion` (req), `whatsapp` (opcional), `estado` (enum, forzado a `en_construccion` en trial).

### Productos (`/mis-productos`) — cliente autenticado
Requiere tienda creada. Seguridad: todas las ops de storage filtran por `tiendaId`.

Schema Producto: `nombre` (req, min 3), `descripcion`, `categoria`, `precio` (req), `precioPromocional`, `tipo` (enum: `'fisico'|'digital'|'servicio'`), `pesoKg` (req si fisico), `dimensiones.altoCm/anchoCm/largoCm` (req si fisico), `stock`, `imagenes` (array rutas), `destacado`, `esNovedad`, `esOferta`, `tags`, `tituloSEO` (max 70), `descripcionSEO` (max 160), `activo`.

---

## Patrones y convenciones

- **Async/await** en todos los controllers y storage
- **Storage layer**: DB aislada en `storage/`
- **PRG (Post-Redirect-Get)**: formularios HTML usan POST → redirect
- **`select: false`** en `contrasena`; recuperado con `.select('+contrasena')` solo en login
- **`normalizarProducto(body, tiendaId, files, imagenesActuales)`**: helper centralizado en productosController para crear y editar
- **Trial**: `enTrial = usuario.trialHasta && new Date(usuario.trialHasta) > new Date()`
- **Imágenes**: multer guarda en `public/uploads/productos/`. En Render free tier el filesystem es efímero.
- Precios en **pesos argentinos (ARS)**

---

## Convenciones de trabajo con IA

- **Commits**: mensajes breves, descriptivos y humanos. No mencionar IA, asistentes, herramientas ni coautoría automática.
- **Comentarios de código**: usar solo cuando aporten contexto real. Deben ser cortos y naturales; evitar comentarios obvios o redactados como texto generado.
- **Push**: preguntar siempre antes de subir cambios al remoto.

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/techretail` | URI de conexión MongoDB |
| `SESSION_SECRET` | — | Secreto para express-session (requerido en producción) |
| `NODE_ENV` | — | Si es `'development'`, errores 500 incluyen stack trace |
| `PORT` | `3000` | Puerto del servidor |

---

## Deploy

El proyecto está desplegado en Render: `techretail-jc1f.onrender.com`

---

## Material de la cátedra

La carpeta `material_tecnicatura/` contiene los PDFs de los bloques de la materia. No modificar ni borrar.
