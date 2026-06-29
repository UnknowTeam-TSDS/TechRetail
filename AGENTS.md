# TechRetail Solutions S.R.L. - AGENTS.md

## Contexto del proyecto

Trabajo practico de la **Entrega Final / 3er Parcial** de la materia **Desarrollo Web Backend** de la Tecnicatura en Programacion, IFST 29.

El proyecto parte del relevamiento realizado para **Ingenieria de Software** por el Grupo 13. La empresa ficticia es **TechRetail Solutions S.R.L.**, una plataforma SaaS de e-commerce para PyMEs y emprendedores digitales en Argentina.

El sistema ya no es solamente un CRUD administrativo. En la version actual implementa:

- Panel de administracion interno con dashboard, metricas, planes, add-ons y clientes.
- Panel de cliente con registro, login, seleccion de plan, trial, add-ons, tienda propia y catalogo.
- Tienda publica con vista de tienda y detalle de producto.

Los modulos **Tienda** y **Productos** se agregaron para acercar el backend al relevamiento original y al flujo real de creacion de una tienda online. Si se agregan mas funciones, deben estar justificadas en la documentacion y mantenerse dentro de un alcance razonable para la entrega.

## Reglas para agentes

- Leer este archivo antes de tocar el proyecto.
- No modificar `.env`.
- No subir `node_modules`.
- No mencionar IA, asistentes, modelos ni coautoria automatizada en commits.
- Usar commits breves, descriptivos y humanos.
- Preguntar antes de hacer `git push`, salvo que el usuario lo pida explicitamente.
- Revisar arquitectura y tests antes de cambios grandes.
- Mantener cambios acotados a la tarea.
- No revertir cambios del usuario sin permiso.
- No agregar tecnologias nuevas si el problema se resuelve con el stack actual.
- Los comentarios de codigo deben ser breves, naturales y utiles. Evitar comentarios obvios o roboticos.

## Grupo 13 - Comision E

| Integrante | Rol en IS |
|------------|-----------|
| Melchiori Leandro | Squad UX/Prod - Onboarding guiado (RF-05) |
| Navarro Javier | Squad Pagos - Checkout (RF-01) |
| Zarate Carlos | Squad Monitoreo - Alertas churn (RF-02) |
| Choque Heber | Squad Finanzas - Conciliacion (RF-03) |
| Basarab Lautaro | Squad Logistica - Integracion logistica (RF-04) |

## Stack tecnologico

| Capa | Tecnologia |
|------|------------|
| Runtime | Node.js |
| Framework | Express 5.x |
| Base de datos | MongoDB Atlas + Mongoose 9.x |
| Autenticacion | express-session + bcryptjs |
| Vistas | Pug 3.x + Tailwind CSS por CDN |
| Uploads | multer |
| Tiempo real | Socket.io |
| Tests | Jest |
| Desarrollo | nodemon |

## Comandos

```bash
npm run dev
npm start
npm test
```

Servidor local:

```txt
http://localhost:3000
```

Deploy en Render:

```txt
https://techretail-jc1f.onrender.com
```

Credenciales admin por defecto:

```txt
Email: admin@techretail.com
Password: 123456
```

## Variables de entorno

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://localhost:27017/techretail` | URI de MongoDB local o Atlas |
| `SESSION_SECRET` | - | Secreto de sesion. Requerido en produccion |
| `NODE_ENV` | - | En `development`, muestra detalle de errores 500 |
| `PORT` | `3000` | Puerto del servidor |

No commitear `.env`.

## Datos iniciales

`src/config/seed.js` sincroniza el catalogo canonico con upsert por nombre y limpieza de items no canonicos.

Planes:

- Starter - $12.000
- Growth - $32.000
- Pro - $55.000

Add-ons:

- Guia de Onboarding - gratis, de uso unico.
- Conector ERP - $8.000.
- Facturacion Electronica ARCA - $5.000.

El seed tambien crea el usuario admin si no existe.

## Arquitectura

Patron **MVC modular**. Cada modulo mantiene router, controller, storage, model y views cuando aplica.

```text
TechRetail/
|-- app.js
|-- public/
|   |-- js/password.js
|   |-- uploads/productos/
|   |-- manifest.json
|   |-- sw.js
|   |-- offline.html
|   `-- techretail_*.svg
|-- src/
|   |-- config/
|   |   |-- mongodb.js
|   |   |-- multer.js
|   |   `-- seed.js
|   |-- middlewares/
|   |   |-- autenticacion.js
|   |   `-- logger.js
|   |-- modules/
|   |   |-- Auth/
|   |   |-- Planes/
|   |   |-- Productos/
|   |   |-- Tienda/
|   |   `-- usuarios/
|   `-- views/
|       |-- layout.pug
|       `-- index.pug
`-- tests/
```

`app.js`:

- Carga `dotenv`.
- Crea `http.createServer(app)` para Socket.io.
- Sirve archivos estaticos desde `public`.
- Configura sesiones.
- Monta rutas publicas, de cliente y de admin.
- Expone Socket.io en `app.set('io', io)`.
- Eventos de Socket.io en tiempo real: `nuevo-usuario`, `nuevo-plan`, `plan-seleccionado`, `nueva-tienda`, `tienda-publicada` y `nuevo-producto`.

## Modulos y rutas principales

### Auth

Publicas:

- `GET /login`
- `POST /login`
- `POST /logout`
- `GET /registro`
- `POST /registro`

Cliente autenticado:

- `GET /elegir-plan`
- `POST /elegir-plan`
- `GET /mi-cuenta`
- `POST /mis-addons/agregar`
- `POST /mis-addons/quitar`
- `GET /cambiar-contrasena`
- `POST /cambiar-contrasena`

Flujo:

- Admin inicia sesion y va al dashboard `/`.
- Cliente sin plan va a `/elegir-plan`.
- Cliente con plan o trial va a `/mi-cuenta`.
- Usuarios creados por admin tienen `cambiarContrasena: true` y deben cambiar contrasena en el primer login.
- `validarContrasenaSegura()` exige minimo 8 caracteres, minuscula, mayuscula, numero y simbolo.

### Planes

Admin:

- `GET /planes/vista`
- `POST /planes/form`
- `POST /planes/eliminar/:id`

API admin:

- `GET /api/planes`
- `POST /api/planes`
- `GET /api/planes/:id`
- `PUT /api/planes/:id`
- `DELETE /api/planes/:id`

### Usuarios

Admin:

- `GET /usuarios/vista`
- `POST /usuarios/form`
- `POST /usuarios/eliminar/:id`
- `POST /usuarios/estado/:id`

API admin:

- `GET /api/usuarios`
- `POST /api/usuarios`
- `GET /api/usuarios/:id`
- `PUT /api/usuarios/:id`
- `DELETE /api/usuarios/:id`

### Tienda

Cliente autenticado:

- `GET /mi-tienda`
- `GET /mi-tienda/editar`
- `POST /mi-tienda`
- `POST /mi-tienda/publicar`
- `POST /mi-tienda/despublicar`

Publicas:

- `GET /tienda/:id`
- `GET /tienda/:id/producto/:productoId`
- `GET /tienda/:id/carrito`
- `POST /tienda/:id/carrito/agregar/:productoId`
- `POST /tienda/:id/carrito/actualizar/:productoId`
- `POST /tienda/:id/carrito/quitar/:productoId`
- `POST /tienda/:id/carrito/vaciar`

Reglas:

- Una tienda por cliente (`usuarioId` unico).
- Durante trial, la tienda permanece `en_construccion`.
- Para publicar, el cliente debe tener plan pago.
- Datos legales obligatorios: email de contacto, telefono y direccion.
- WhatsApp es opcional.
- El color principal queda en el modelo como base para una futura personalizacion visual, pero no se edita desde la creacion inicial.
- El carrito publico vive en la sesion del visitante y no mezcla productos de distintas tiendas.
- El pago del carrito es simulado para la presentacion; no genera orden real ni procesa dinero.

### Productos

Cliente autenticado:

- `GET /mis-productos`
- `POST /mis-productos/form`
- `GET /mis-productos/editar/:id`
- `POST /mis-productos/editar/:id`
- `POST /mis-productos/eliminar/:id`
- `POST /mis-productos/estado/:id`

Reglas:

- Requiere tienda creada.
- Todo acceso a productos filtra por `tiendaId`, para impedir modificar productos de otra tienda.
- Categorias se eligen desde un selector y se pueden crear desde el formulario.
- Productos fisicos requieren peso y dimensiones para logistica.
- Productos digitales o servicios no requieren peso ni dimensiones.
- Imagenes se suben con multer a `public/uploads/productos/`.
- En Render free tier el filesystem es efimero; si una imagen se pierde, la UI debe mostrar placeholder "Sin imagen".

## Modelos principales

### Usuario

Campos relevantes:

- `nombre`, `email`, `contrasena`
- `empresa`, `telefono`
- `planId`, `addons`
- `rol`, `estado`
- `trialHasta`
- `cambiarContrasena`

Notas:

- `contrasena` tiene `select: false`.
- Login usa `.select('+contrasena')`.
- La contrasena se hashea con bcrypt en `pre('save')`.
- Las queries poblan `planId` y `addons`.

### Plan

Campos relevantes:

- `nombre`
- `descripcion`
- `precio`
- `tipo`: `plan` o `addon`
- `activo`

### Tienda

Campos relevantes:

- `usuarioId`
- `nombre`
- `descripcion`
- `rubro`
- `colorPrimario`
- `emailContacto`
- `telefono`
- `direccion`
- `whatsapp`
- `estado`

### Producto

Campos relevantes:

- `tiendaId`
- `nombre`, `descripcion`, `categoria`
- `precio`, `precioPromocional`
- `tipo`: `fisico`, `digital`, `servicio`
- `pesoKg`
- `dimensiones.altoCm`, `dimensiones.anchoCm`, `dimensiones.largoCm`
- `stock`
- `imagenes`
- `destacado`, `esNovedad`, `esOferta`
- `tags`
- `tituloSEO`, `descripcionSEO`
- `activo`

## Patrones y convenciones

- Usar `async/await`.
- Mantener controllers claros y sin mezclar responsabilidades innecesarias.
- Usar storage layer para acceso a base cuando el modulo ya lo tiene.
- Formularios HTML con PRG: POST -> redirect.
- Respetar rutas protegidas con `verificarSesion` o `verificarAdmin`.
- Usar codigos HTTP correctos en API y login.
- No tocar cambios ajenos ni revertir archivos no relacionados.
- Mantener los cambios acotados a la tarea.
- Evitar overengineering: si una mejora se resuelve con modelo + controller + vista, no crear infraestructura extra.

## Tests

Jest esta configurado en `package.json`.

Hay tests para:

- middleware de autenticacion
- politica de contrasena
- modelos: Plan, Usuario, Tienda, Producto
- eventos WebSocket emitidos desde Auth, Tienda y Productos
- controllers: Auth, Tienda, Productos (actualmente planes y usuarios no poseen tests específicos de controlador)

Antes de commitear cambios de logica, correr:

```bash
npm test
```

Si PowerShell bloquea `npm.ps1`, usar:

```bash
npm.cmd test
```

### Integración Continua (CI)

Configurada en `.github/workflows/ci.yml`. Corre los tests en Node 20 y 22 en cada Push o PR a `main`.

### Pruebas de API (Postman)

Existe una colección de pruebas en `src/postman/TechRetail - Test general.postman_collection.json`.

## Convenciones de commits y push

- Commits breves, descriptivos y humanos.
- No mencionar IA, asistentes, herramientas ni coautoria automatizada.
- Comentarios de codigo solo cuando aporten contexto real.
- Comentarios cortos, naturales y explicativos.
- Preguntar siempre antes de hacer `git push`, salvo que el usuario lo pida explicitamente.
- No commitear `node_modules`.

## Archivos y carpetas que no deben subirse

- `.env`
- `node_modules/`
- `material_tecnicatura/`
- `public/uploads/`

`public/techretail_*.svg` son recursos de documentacion y pueden estar versionados.

## Material de referencia

- `material_tecnicatura/`: PDFs de la catedra. No modificar ni borrar.
- Relevamiento de Ingenieria de Software: base funcional del dominio.
- Tutorial de Tiendanube: referencia UX para tienda, productos, onboarding y catalogo.
