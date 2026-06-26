# TechRetail Solutions S.R.L. — AGENTS.md

## Contexto del proyecto

Trabajo práctico del **2° Parcial** de la materia **Desarrollo Web Backend** (Técnicatura en Programación, IFST 29).

El proyecto está basado en el relevamiento de empresa que el mismo grupo (Grupo 13) entregó para **Ingeniería de Software** (PFO1). La empresa ficticia es **TechRetail Solutions S.R.L.**, una plataforma SaaS de e-commerce para PyMEs y emprendedores digitales en Argentina.

**El backend implementa el panel de administración interno** de la plataforma: gestión de planes de suscripción y clientes. NO incluye el storefront para compradores finales, checkout, logística ni facturación electrónica — esos módulos pertenecen al sistema completo de IS, no al alcance del parcial de backend.

### Grupo 13 — Comisión E

| Integrante | Rol en IS |
|------------|-----------|
| Melchiori Leandro (usuario) | Squad UX/Prod — Onboarding guiado (RF-05) |
| Navarro Javier | Squad Pagos — Checkout (RF-01) |
| Zárate Carlos | Squad Monitoreo — Alertas churn (RF-02) |
| Choque Heber | Squad Finanzas — Conciliación (RF-03) |
| Basarab Lautaro | Squad Logística — Integración logística (RF-04) |

### Criterios de evaluación del parcial

El docente evalúa los **contenidos vistos en clase** hasta la fecha, no funcionalidades extra. Los temas cubiertos por los bloques del material son:

- Bloque 3: Organización MVC modular
- Bloque 5.1–5.2: Middleware en Express + motor de vistas Pug
- Bloque 6.2–6.3: Peticiones HTTP, CORS, códigos de estado HTTP
- Bloque 7.1–7.3: MongoDB con Mongoose (schemas, operadores)
- Bloque 8.0: Gestión de usuarios y seguridad (sesiones, bcrypt)

**Importante**: El docente advierte explícitamente contra el overengineering. No agregar funcionalidades, arquitecturas ni tecnologías más allá de lo pedido. Mantener el código claro y coherente con lo visto en clase.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Framework | Express 5.x |
| Base de datos | MongoDB + Mongoose 9.x |
| Autenticación | express-session + bcryptjs |
| Vistas | Pug 3.x + Tailwind CSS (CDN) |
| Dev | nodemon |

---

## Cómo correr el proyecto

```bash
# Requiere MongoDB corriendo localmente en el puerto 27017
npm run dev    # nodemon, recarga automática
npm start      # node app.js
```

Servidor en: `http://localhost:3000`

**Credenciales por defecto** (se crean automáticamente con el seed):
- Email: `admin@techretail.com`
- Password: `123456`

El seed crea automáticamente 3 planes (Starter $15.000, Growth $45.000, Pro $80.000) y el usuario admin si la base está vacía.

---

## Arquitectura

Patrón **MVC modular**: cada módulo tiene su propia carpeta con router → controller → storage → model → views.

```
TechRetail/
├── app.js                          # Entry point: Express, sesiones, middlewares globales, montaje de routers
├── src/
│   ├── config/
│   │   ├── mongodb.js              # Conexión a MongoDB
│   │   └── seed.js                 # Datos iniciales (planes + admin)
│   ├── middlewares/
│   │   ├── autenticacion.js        # verificarSesion(), verificarAdmin()
│   │   └── logger.js               # Log de cada request
│   ├── modules/
│   │   ├── Auth/                   # Login / Logout
│   │   │   ├── controllers/authController.js
│   │   │   ├── routers/authRouter.js
│   │   │   └── views/login.pug
│   │   ├── Planes/                 # CRUD planes y add-ons
│   │   │   ├── controllers/planesController.js
│   │   │   ├── routers/planesRouter.js
│   │   │   ├── storage/planesStorage.js
│   │   │   ├── models/Plan.js
│   │   │   └── views/planes.pug
│   │   └── usuarios/               # CRUD usuarios/clientes
│   │       ├── controllers/usuariosController.js
│   │       ├── routers/usuariosRouter.js
│   │       ├── storage/usuariosStorage.js
│   │       ├── models/Usuario.js
│   │       └── views/usuarios.pug
│   └── views/
│       ├── layout.pug              # Template base con nav, header, footer
│       └── index.pug               # Dashboard admin
└── material_tecnicatura/           # PDFs de la cátedra (no parte del código)
```

---

## Módulos

### Auth
- `GET /login` — Renderiza formulario de login
- `POST /login` — Valida email/password con bcrypt, crea sesión
- `POST /logout` — Destruye sesión

### Planes (`/planes` y `/api/planes`)
Gestión de planes de suscripción y add-ons de la plataforma.

Vistas HTML (PRG pattern):
- `GET /planes/vista` — Lista planes y add-ons
- `POST /planes/form` — Crea plan desde formulario
- `POST /planes/eliminar/:id` — Elimina plan desde formulario

API REST (JSON):
- `GET /api/planes`
- `POST /api/planes`
- `GET /api/planes/:id`
- `PUT /api/planes/:id`
- `DELETE /api/planes/:id`

Schema Plan: `nombre` (req, min 3), `descripcion` (req), `precio` (req, >0), `tipo` (enum: `'plan'|'addon'`), `activo` (bool), timestamps.

### Usuarios (`/usuarios` y `/api/usuarios`)
Gestión de cuentas de clientes de la plataforma.

Vistas HTML (PRG pattern):
- `GET /usuarios/vista` — Lista clientes (excluye admins)
- `POST /usuarios/form` — Registra usuario desde formulario
- `POST /usuarios/eliminar/:id` — Elimina usuario desde formulario

API REST (JSON):
- `GET /api/usuarios`
- `POST /api/usuarios`
- `GET /api/usuarios/:id`
- `PUT /api/usuarios/:id`
- `DELETE /api/usuarios/:id`

Schema Usuario: `nombre` (req, min 3), `email` (req, único, válido), `contrasena` (req, min 6, hashed, `select: false`), `empresa`, `telefono`, `planId` (ref Plan), `rol` (enum: `'admin'|'cliente'`), `estado` (enum: `'activo'|'inactivo'|'suspendido'`), timestamps.

La contraseña se hashea automáticamente via middleware `pre('save')` de Mongoose con bcryptjs (10 rounds).

---

## Patrones y convenciones

- **Async/await** en todos los controllers y storage — nunca callbacks ni `.then()`
- **Storage layer**: las operaciones de DB están aisladas en `storage/` para separar acceso a datos de lógica HTTP
- **PRG (Post-Redirect-Get)**: los formularios HTML usan POST → redirect para evitar reenvío al refrescar
- **`select: false`** en el campo `contrasena` del schema; se recupera explícitamente con `.select('+contrasena')` solo en el login
- **`res.locals.usuarioLogueado`**: el middleware global pasa el usuario de sesión a todas las vistas Pug
- Los precios se expresan en **pesos argentinos (ARS)**

---

## Bugs conocidos

### Bug activo — `usuarios.pug:63`
El template verifica `usuario.activo` (campo inexistente) en lugar de `usuario.estado === 'activo'`. Esto hace que todos los usuarios aparezcan como "Inactivo" en la tabla.

```pug
// ❌ Actual (incorrecto)
if usuario.activo

// ✅ Correcto
if usuario.estado === 'activo'
```

### Bug potencial — `usuarios.pug` (referencia a `planId`)
Si un usuario no tiene plan asignado, `usuario.planId.nombre` lanzará error. Agregar guard: `if usuario.planId`.

### Status code incorrecto — `authController.js`
Login fallido devuelve HTTP 200 en lugar de 401.

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/techretail` | URI de conexión MongoDB |
| `NODE_ENV` | — | Si es `'development'`, los errores 500 incluyen el stack trace |
| `PORT` | `3000` | Puerto del servidor (hardcodeado en app.js, no usa esta variable aún) |

---

## Material de la cátedra

La carpeta `material_tecnicatura/` contiene los PDFs de los bloques de la materia. Son la referencia de lo que el docente evalúa. No modificar ni borrar.

---

## Convenciones de trabajo

- **Commits**: mensajes breves, descriptivos y humanos. No mencionar IA, asistentes, herramientas ni coautoria automatica.
- **Comentarios de codigo**: usar solo cuando aporten contexto real. Deben ser cortos, naturales y explicativos; evitar comentarios obvios o redactados como texto generado.
- **Push**: preguntar siempre antes de subir cambios al remoto.
