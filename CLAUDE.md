# TechRetail Solutions S.R.L. — CLAUDE.md

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

El seed crea automáticamente 3 planes (Starter $12.000, Growth $32.000, Pro $55.000), 3 add-ons (Guía de Onboarding, Conector ERP y Facturación Electrónica ARCA) y el usuario admin si la base está vacía.

---

## Arquitectura

Patrón **MVC modular**: cada módulo tiene su propia carpeta con router → controller → storage → model → views.

```
TechRetail/
├── app.js
├── public/
│   ├── uploads/productos/          # Imágenes subidas con multer (no committeadas)
│   ├── manifest.json               # Configuración de la PWA
│   ├── sw.js                       # Service Worker (instalable/offline)
│   └── offline.html                # Pantalla de respaldo offline para la PWA
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
Gestión de planes de suscripción y add-ons.

Vistas HTML (PRG): `GET /planes/vista`, `POST /planes/form`, `POST /planes/eliminar/:id`

API REST: `GET|POST /api/planes`, `GET|PUT|DELETE /api/planes/:id`

Schema Plan: `nombre` (req, min 3), `descripcion` (req), `precio` (req, ≥0), `tipo` (enum: `'plan'|'addon'`), `activo` (bool), timestamps.

### Usuarios (`/usuarios` y `/api/usuarios`) — solo admin
Gestión de cuentas de clientes.

Vistas HTML (PRG): `GET /usuarios/vista`, `POST /usuarios/form`, `POST /usuarios/eliminar/:id`

API REST: `GET|POST /api/usuarios`, `GET|PUT|DELETE /api/usuarios/:id`

Schema Usuario: `nombre` (req, min 3), `email` (req, único), `contrasena` (req, min 6, hashed, `select:false`), `empresa`, `telefono`, `planId` (ref Plan), `rol` (enum: `'admin'|'cliente'`), `estado` (enum: `'activo'|'inactivo'|'suspendido'`), `trialHasta` (Date), `addons` (array ref Plan), timestamps.

### Tienda (`/mi-tienda`) — cliente autenticado
Configuración de tienda propia. Una tienda por usuario (`usuarioId: unique`).

- `GET /mi-tienda` — Formulario de configuración (crear o editar)
- `POST /mi-tienda` — Guarda/actualiza la tienda (upsert)

Schema Tienda:
- `usuarioId` (ref Usuario, req, unique)
- `nombre` (req, min 3)
- `descripcion`
- `rubro` (enum: `'moda'|'electronica'|'hogar'|'alimentos'|'servicios'|'otro'`, req)
- `colorPrimario` (hex, default `#1D4ED8`)
- `emailContacto` (req, email — Res. 104/2005 Defensa del Consumidor)
- `telefono` (req)
- `direccion` (req)
- `whatsapp` (opcional)
- `estado` (enum: `'en_construccion'|'activa'|'inactiva'`, default `en_construccion`)
- Si el usuario está en trial, `estado` se fuerza a `en_construccion`

### Productos (`/mis-productos`) — cliente autenticado
Catálogo de productos por tienda. Requiere tienda creada; si no hay tienda redirige a `/mi-tienda`.

- `GET /mis-productos` — Lista productos
- `POST /mis-productos/form` — Crea producto (multer: hasta 5 imágenes)
- `GET /mis-productos/editar/:id` — Formulario de edición
- `POST /mis-productos/editar/:id` — Actualiza producto (multer: agrega nuevas imágenes a las existentes)
- `POST /mis-productos/estado/:id` — Activa/desactiva
- `POST /mis-productos/eliminar/:id` — Elimina

Schema Producto:
- `tiendaId` (ref Tienda, req)
- `nombre` (req, min 3), `descripcion`, `categoria`
- `precio` (req, ≥0), `precioPromocional` (opcional)
- `tipo` (enum: `'fisico'|'digital'|'servicio'`, default `'fisico'`)
- `pesoKg` (req si tipo=fisico), `dimensiones.altoCm/anchoCm/largoCm` (req si tipo=fisico)
- `stock` (default 0)
- `imagenes` (array de rutas `/uploads/productos/...`)
- `destacado`, `esNovedad`, `esOferta` (bool, default false)
- `tags` (array string), `tituloSEO` (max 70), `descripcionSEO` (max 160)
- `activo` (bool, default true)

La seguridad de cross-user se garantiza pasando siempre `tiendaId` como filtro en todas las operaciones de storage.

---

## WebSockets (Socket.io)

El servidor implementa comunicacion bidireccional en tiempo real. Guarda la instancia `io` en la aplicacion (`app.set('io', io)`) para usarla desde los controllers:
*   `nuevo-usuario`: emitido al registrar o crear un cliente.
*   `nuevo-plan`: emitido al crear un plan o add-on.
*   `plan-seleccionado`: emitido cuando un cliente elige un plan.
*   `nueva-tienda`: emitido cuando un cliente crea su tienda.
*   `tienda-publicada`: emitido cuando una tienda pasa a estado activa.
*   `nuevo-producto`: emitido cuando se carga un producto en una tienda.

El `layout.pug` escucha estos eventos, muestra una notificacion y refresca el dashboard administrativo cuando el usuario no esta escribiendo en un formulario.

---

## Calidad, Tests y CI

*   **Tests Unitarios e Integración**: Configurados con Jest (`npm.cmd test`).
    *   **Cobertura**:
        *   Modelos: `Plan`, `Usuario`, `Tienda`, `Producto`.
        *   Controladores: `authController`, `productosController`, `tiendaController`.
        *   Lógica y seguridad: Políticas de contraseñas y middleware de sesión.
*   **Integración Continua (CI)**: Configurada en `.github/workflows/ci.yml`. Ejecuta las pruebas automáticamente en Node 20 y 22 ante cada Push o PR a `main`.
*   **API Testing**: Colección de Postman disponible en `src/postman/TechRetail - Test general.postman_collection.json`.

---

## Patrones y convenciones

- **Async/await** en todos los controllers y storage
- **Storage layer**: DB aislada en `storage/`
- **PRG (Post-Redirect-Get)**: formularios HTML usan POST → redirect
- **`select: false`** en `contrasena`; se recupera con `.select('+contrasena')` solo en login
- **`res.locals.usuarioLogueado`**: middleware global para vistas Pug
- **`normalizarProducto(body, tiendaId, files, imagenesActuales)`**: helper en productosController que centraliza parseo y validación de campos para crear y editar
- **Trial vs plan pago**: `enTrial = usuario.trialHasta && new Date(usuario.trialHasta) > new Date()` — los add-ons y el estado activo de tienda requieren `planPago = !!(usuario.planId) && !enTrial`
- **Imágenes**: multer guarda en `public/uploads/productos/`. En Render (free tier) el filesystem es efímero — las imágenes se pierden al redeploy
- Los precios se expresan en **pesos argentinos (ARS)**

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

## Convenciones de trabajo con IA

- **Commits**: mensajes breves, descriptivos y humanos. No mencionar IA, asistentes, herramientas ni coautoría automática.
- **Comentarios de código**: usar solo cuando aporten contexto real. Deben ser cortos y naturales; evitar comentarios obvios o redactados como texto generado.
- **Push**: preguntar siempre antes de subir cambios al remoto.

---

## Material de la cátedra

La carpeta `material_tecnicatura/` contiene los PDFs de los bloques de la materia. No modificar ni borrar.

