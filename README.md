# TechRetail Solutions S.R.L.

[![CI](https://github.com/UnknowTeam-TSDS/TechRetail/actions/workflows/ci.yml/badge.svg)](https://github.com/UnknowTeam-TSDS/TechRetail/actions/workflows/ci.yml)

**Plataforma SaaS de Comercio Electrónico para PyMEs Argentinas**

Proyecto académico del Segundo Parcial Backend | Grupo 13 | Tecnología Informática

---

## 📋 Descripción

**TechRetail Solutions S.R.L.** es una plataforma SaaS escalable diseñada para ayudar a pequeñas y medianas empresas argentinas a gestionar su negocio de comercio electrónico. Permite la administración de planes de suscripción, registro de usuarios/clientes y un sistema de autenticación robusto.

### Características Principales

- ✅ **Sistema de Autenticación** con contraseñas hasheadas (bcryptjs)
- ✅ **Gestión de Planes** (Starter, Growth, Pro)
- ✅ **Registro y Gestión de Usuarios**
- ✅ **Control de Roles** (Admin y Cliente) - implementación escalable
- ✅ **Sesiones Seguras** con express-session
- ✅ **API REST** con endpoints documentados
- ✅ **Vistas Responsivas** con Tailwind CSS

---

## 🚀 Tecnología

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **bcryptjs** - Hash de contraseñas

### Frontend
- **Pug** - Motor de plantillas
- **Tailwind CSS** (CDN) - Framework CSS

### Herramientas
- **Postman** - Testing de APIs
- **Git** - Control de versiones

---

## 📁 Estructura del Proyecto

```
TechRetail/
├── src/
│   ├── config/
│   │   ├── mongodb.js           # Conexión a MongoDB
│   │   └── seed.js              # Datos iniciales (planes, admin)
│   │
│   ├── middlewares/
│   │   └── autenticacion.js     # Middleware de autenticación
│   │   └── logger.js            # Middleware de logger
│   │
│   ├── modules/
│   │   ├── auth/                # Módulo de Autenticación
│   │   │   ├── controllers/
│   │   │   │   └── authController.js
│   │   │   ├── routers/
│   │   │   │   └── authRouter.js
│   │   │   └── views/
│   │   │       └── login.pug
│   │   │
│   │   ├── Planes/              # Módulo de Planes
│   │   │   ├── models/
│   │   │   │   └── Plan.js
│   │   │   ├── controllers/
│   │   │   │   └── planesController.js
│   │   │   ├── routers/
│   │   │   │   └── planesRouter.js
│   │   │   └── views/
│   │   │       └── planes.pug
│   │   │
│   │   └── usuarios/            # Módulo de Usuarios
│   │       ├── models/
│   │       │   └── Usuario.js
│   │       ├── controllers/
│   │       │   └── usuariosController.js
│   │       ├── routers/
│   │       │   └── usuariosRouter.js
│   │       └── views/
│   │           └── usuarios.pug
│   │
│   ├── views/                   # Vistas globales
│   │   ├── layout.pug           # Layout principal
│   │   └── index.pug            # Dashboard
│   │
│   └── postman/                 # Colección de tests
│       └── TechRetail - Test general.postman_collection.json
│
├── app.js                       # Punto de entrada
├── package.json
└── README.md
```

---

## 🔐 Autenticación y Roles

### Modelo Usuario

El modelo `Usuario` contiene los siguientes campos:

```javascript
{
  nombre: String,              // Nombre completo
  email: String,               // Email único
  empresa: String,             // Nombre de la empresa
  telefono: String,            // Teléfono de contacto
  contrasena: String,          // Contraseña hasheada (bcryptjs)
  rol: Enum ['admin', 'cliente'], // Rol del usuario
  planId: ObjectId,            // Referencia al plan suscrito
  estado: Enum ['activo', 'inactivo', 'suspendido'],
  fechaRegistro: Date,         // Fecha de creación
  fechaActualizacion: Date     // Última actualización
}
```

### Roles Disponibles

| Rol | Acceso | Permisos |
|-----|--------|----------|
| **admin** | `/`, `/planes/vista`, `/usuarios/vista` | Gestiona planes y usuarios |
| **cliente** | En desarrollo | Verá su información, plan y funciones habilitadas |

---

## ⚙️ Instalación

### Requisitos
- Node.js v18+
- MongoDB local o Atlas
- npm o yarn

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <url-repositorio>
   cd TechRetail
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz:
   ```env
   MONGO_URI=mongodb://localhost:27017/[DB_NAME]
   PORT=[PORT]
   ```

4. **Iniciar servidor**
   ```bash
   npm start
   ```

5. **Acceder a la aplicación**
   ```
   http://localhost:3000/login
   ```

---

## API Endpoints

### Autenticación
```
POST   /login              Iniciar sesión
POST   /logout             Cerrar sesión
GET    /login              Ver formulario de login
```

### Planes (requiere autenticación)
```
GET    /api/planes         Listar todos los planes (JSON)
GET    /planes/vista       Ver planes (HTML)
POST   /api/planes         Crear nuevo plan
PUT    /api/planes/:id     Actualizar plan
DELETE /api/planes/:id     Eliminar plan
```

### Usuarios (requiere autenticación)
```
GET    /api/usuarios       Listar todos los usuarios (JSON)
GET    /usuarios/vista     Ver usuarios (HTML)
POST   /api/usuarios       Crear nuevo usuario
PUT    /api/usuarios/:id   Actualizar usuario
DELETE /api/usuarios/:id   Eliminar usuario
```

---

## 🧪 Testing con Postman

### Importar Colección

1. Abre **Postman**
2. Click en **Import**
3. Selecciona: `src/postman/TechRetail - Test general.postman_collection.json`

## 🔐 Seguridad

### Implementaciones

- ✅ **Contraseñas Hasheadas** con bcryptjs (salt: 10 rounds)
- ✅ **Sesiones Seguras** con express-session
- ✅ **Cookies HttpOnly** para sesiones
- ✅ **Validación de Entrada** en modelos (Mongoose)
- ✅ **Rutas Protegidas** con middleware de autenticación
- ✅ **Emails Únicos** para evitar duplicados

### Próximas Mejoras

- 🔲 CSRF tokens
- 🔲 Rate limiting
- 🔲 Logs de auditoría
- 🔲 Autenticación OAuth

---

## 📝 Configuración de la Base de Datos

### Seed Automático

Al iniciar la aplicación, se ejecutan automáticamente:

1. **Planes por defecto**
   - Starter: $15000/mes
   - Growth: $45000/mes
   - Pro: $80000/mes

2. **Admin por defecto**
   - Usuario: admin
   - Email: admin@techretail.com
   - Contraseña: 123456 (hasheada)

### Conexión MongoDB

```javascript
// src/config/mongodb.js
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ Conectado a MongoDB'))
  .catch(err => console.error('✗ Error:', err));
```

---

## 🛠️ Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor (desarrollo)
npm start

# Iniciar con nodemon (auto-reload)
npm run dev  # si está configurado
```

---

## 👥 Equipo de Desarrollo

| Integrante | Rol |
|------------|-----|
| Sacha Melchiori | Tech Lead / Backend Architect |
| Carlos Zarate | Frontend & UX/UI |
| Javier Navarro | Backend Developer |
| Heber Choque | QA/Tester & Documentation |

---

## 📚 Stack Completo (Segundo Parcial)

- ✅ **Backend:** Node.js/Express + MongoDB/Mongoose
- ✅ **Frontend:** Pug + Tailwind CSS
- ✅ **Autenticación:** Sesiones + Contraseñas Hasheadas
- ✅ **Testing:** Postman (10+ tests)
- ✅ **Documentación:** README + Código comentado

---

## 📖 Próximas Fases

- [ ] Dashboard por rol (Admin vs Cliente)
- [ ] Carrito de compra
- [ ] Pagos (integración Mercado Pago/Stripe)
- [ ] Historial de órdenes
- [ ] Sistema de notificaciones
- [ ] API OAuth (Google, GitHub)
- [ ] Reportes y analíticas
- [ ] Soporte multiidioma
- [ ] Deploy a producción (Heroku/AWS)

