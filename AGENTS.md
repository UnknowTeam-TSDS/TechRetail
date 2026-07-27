# TechRetail Solutions S.R.L. - AGENTS.md

## Contexto

Trabajo practico de la Entrega Final / 3er Parcial de Desarrollo Web Backend, Tecnicatura en Programacion del IFST 29.

TechRetail es una plataforma SaaS de e-commerce para PyMEs y emprendedores argentinos. El sistema implementa:

- Panel admin con clientes, planes, add-ons, metricas, churn y finanzas.
- Panel cliente con registro, login, suscripcion, tienda, productos y pedidos.
- Tienda publica con catalogo, detalle, carrito y checkout simulado.

Los modulos Tienda, Productos, Pedidos y Finanzas conectan la entrega de Backend con el relevamiento de Ingenieria de Software del Grupo 13.

## Reglas de trabajo

- Leer este archivo antes de modificar el proyecto.
- No modificar ni commitear `.env`.
- No subir `node_modules/`, `material_tecnicatura/` ni `public/uploads/`.
- No mencionar IA, asistentes, modelos ni coautoria automatizada en commits.
- Usar commits breves, descriptivos y humanos.
- Preguntar antes de `git push`, salvo pedido explicito del usuario.
- Ejecutar tests y lint antes de commitear cambios de logica.
- Mantener cambios acotados y respetar la arquitectura existente.
- No revertir cambios ajenos sin permiso.
- No agregar tecnologias si el stack actual resuelve el problema.
- Los comentarios de codigo deben ser cortos, naturales y aportar contexto real.

## Grupo 13 - Comision E

| Integrante | Rol en IS |
|------------|-----------|
| Melchiori Leandro | UX/Prod - Onboarding guiado (RF-05) |
| Navarro Javier | Pagos - Checkout (RF-01) |
| Zarate Carlos | Monitoreo - Alertas churn (RF-02) |
| Choque Heber | Finanzas - Conciliacion (RF-03) |
| Basarab Lautaro | Logistica - Integracion logistica (RF-04) |

## Stack

| Capa | Tecnologia |
|------|------------|
| Runtime | Node.js |
| Framework | Express 5.x |
| Base de datos | MongoDB Atlas + Mongoose 9.x |
| Autenticacion | express-session + bcryptjs |
| Vistas | Pug 3.x + Tailwind CSS por CDN |
| Uploads | multer |
| Tiempo real | Socket.io |
| Tests | Jest + Supertest + mongodb-memory-server |
| Calidad | ESLint + GitHub Actions |
| Deploy | Render |

## Comandos

```bash
npm install
npm run dev
npm start
npm test
npm run lint
npm run test:coverage
```

Renderizar un Word a PDF y PNG:

```powershell
.\scripts\render-docx.ps1 `
  -InputPath .\docs\DSWB_Entrega_Final_TechRetail_1C2026_final.docx `
  -OutputDir .\rendered-docx
```

Requiere LibreOffice y Poppler instalados. `rendered-docx/` queda fuera de Git.

Local: `http://localhost:3000`

Deploy: `https://techretail-jc1f.onrender.com`

Admin inicial de desarrollo:

```txt
Email: admin@techretail.com
Password: 123456
```

## Variables de entorno

| Variable | Default | Uso |
|----------|---------|-----|
| `MONGO_URI` | `mongodb://localhost:27017/techretail` | MongoDB local o Atlas |
| `SESSION_SECRET` | solo fallback en desarrollo | Obligatoria en produccion |
| `NODE_ENV` | - | Entorno de ejecucion |
| `PORT` | `3000` | Puerto HTTP |

La aplicacion no inicia en produccion si falta `SESSION_SECRET` o falla MongoDB.

## Catalogo inicial

`src/config/seed.js` sincroniza el catalogo canonico mediante upsert.

Planes:

- Starter - $12.000.
- Growth - $32.000.
- Pro - $55.000.

Add-ons:

- Guia de Onboarding - gratis y de uso unico.
- Conector ERP - $8.000, marcado como proximamente.
- Facturacion Electronica ARCA - $5.000, marcado como proximamente.

## Arquitectura

Patron MVC modular. Los modulos usan router, controller, storage, model y views cuando corresponde.

```text
TechRetail/
|-- app.js
|-- public/
|   |-- js/
|   |-- uploads/productos/
|   |-- manifest.json
|   |-- sw.js
|   `-- offline.html
|-- src/
|   |-- config/
|   |-- middlewares/
|   |-- modules/
|   |   |-- Auth/
|   |   |-- Planes/
|   |   |-- usuarios/
|   |   |-- Tienda/
|   |   |-- Productos/
|   |   |-- Pedidos/
|   |   `-- Finanzas/
|   |-- utils/
|   `-- views/
|-- tests/
`-- docs/
```

`app.js` carga variables, crea Express y el servidor HTTP, inicializa Socket.io, configura sesiones, monta routers, registra errores y conecta MongoDB antes de escuchar el puerto.

La instancia Socket.io se guarda con `app.set('io', io)`. Los controllers la recuperan mediante `req.app.get('io')` a traves de `emitirSocket()`.

Eventos: `nuevo-usuario`, `nuevo-plan`, `plan-seleccionado`, `nueva-tienda`, `tienda-publicada`, `nuevo-producto` y `nuevo-pedido`.

## Modulos y reglas

### Auth y suscripcion

Rutas publicas: `/login`, `/registro`, `/logout`.

Rutas cliente: `/elegir-plan`, `/mi-cuenta`, `/cambiar-contrasena`, `/mis-addons/*`.

- Admin inicia en `/`; cliente se redirige segun contrasena, plan y trial.
- Starter ofrece 15 dias de prueba una sola vez (`trialUtilizado`).
- Al vencer, Starter puede activarse mediante pago simulado sin reiniciar el trial.
- Growth y Pro usan pago simulado.
- La logica comun vive en `src/utils/suscripcion.js`.
- Add-ons requieren un plan pago activo. La Guia de Onboarding es gratis y de uso unico; los pagos siguen proximamente.
- Cuentas creadas por admin o API deben cambiar la contrasena en el primer login.
- La politica segura exige 8 caracteres, minuscula, mayuscula, numero y simbolo.

### Planes y usuarios

Admin HTML: `/planes/vista`, `/usuarios/vista`.

API admin: `/api/planes`, `/api/usuarios` y sus rutas `/:id`.

- No se puede eliminar un plan o add-on asignado a clientes.
- Actualizar usuario por API ignora `contrasena`; el cambio usa el flujo seguro.
- Al eliminar usuario desde panel o API se eliminan sus tiendas, productos y pedidos.
- Borrar manualmente en Atlas no ejecuta la cascada de la aplicacion.

### Tienda

Cliente: `/mi-tienda`, `/mi-tienda/editar`, publicacion, medios de pago y envio.

Publico: `/tienda/:id`, detalle de producto y carrito.

- Una tienda por cliente (`usuarioId` unico).
- Nace `en_construccion`.
- Se puede publicar con plan pago o trial activo.
- Trial vencido o usuario suspendido no mantiene la tienda visible al publico.
- El duenio autenticado puede previsualizar su tienda aunque no este publicada.
- Datos legales obligatorios: email, telefono y direccion. WhatsApp es opcional.
- El color permanece en el modelo para personalizacion futura, no se elige al crear.
- El carrito vive en la sesion del visitante y no mezcla tiendas.

### Productos

Cliente: `/mis-productos` y rutas de alta, edicion, estado y eliminacion.

- Toda operacion filtra por `tiendaId`.
- Categorias se seleccionan y pueden crearse desde el formulario.
- Productos fisicos requieren peso y dimensiones.
- Precio promocional, si existe, debe ser menor al precio normal.
- Hasta 5 imagenes de 5 MB con multer.
- En Render el filesystem es efimero; la interfaz muestra `Sin imagen` si falta el archivo.

### Pedidos y checkout

Publico: `POST /tienda/:id/checkout` y confirmacion del pedido.

Cliente: `/mis-pedidos` y cambio de estado.

- El checkout persiste un pedido simulado; no procesa dinero ni guarda tarjetas.
- El stock fisico se reserva de forma atomica y se revierte si falla el pedido.
- Cancelar repone stock. Un pedido cancelado no puede confirmarse despues.
- La confirmacion publica solo es visible para la misma sesion compradora o el duenio.
- Los totales de ventas consideran pedidos confirmados.

### Finanzas

Admin: `GET /finanzas`.

- MRR solo incluye planes pagos activos, nunca trials.
- Add-ons pagos y ventas se muestran por separado.
- Pedidos se agrupan por estado para conciliacion simulada.

## Modelos

- `Usuario`: identidad, rol, estado, plan, add-ons, trial y cambio de clave.
- `Plan`: plan o add-on, precio, descripcion y estado.
- `Tienda`: duenio, identidad comercial, datos legales, medios y publicacion.
- `Producto`: catalogo, precios, stock, imagenes, SEO y logistica.
- `Pedido`: copia historica de items, comprador, total, medio y estado.

## Seguridad

- Cookies `httpOnly`, `sameSite: 'lax'` y `secure` en produccion.
- Rate limit en login.
- bcrypt para hashes; `contrasena` usa `select: false` y no se serializa a JSON.
- `verificarSesion` y `verificarAdmin` protegen rutas.
- `validarObjectId` evita CastError y responde HTML o JSON segun la ruta.
- Guardas por `tiendaId` evitan acceso cruzado.
- Variables sensibles quedan fuera de Git.

## Tests y CI

Estado verificado: 18 suites y 200 tests pasando, ESLint limpio y 19 vistas Pug compiladas.

Cobertura: autenticacion, password policy, suscripcion, middlewares, modelos, controllers, storage, WebSockets e integracion HTTP.

GitHub Actions ejecuta lint y tests en Node 20 y 22 para push y pull request sobre `main`.

## Limitaciones conocidas

- Los pagos son simulados.
- No hay integracion real con MercadoPago, ARCA ni couriers.
- Los uploads locales se pierden en redeploys del plan gratuito de Render.
- `express-session` usa MemoryStore; sirve para la demo con una instancia, pero produccion real requiere un store persistente como MongoDB/Redis.
- No hay tokens CSRF dedicados; `sameSite: 'lax'` solo reduce parte del riesgo.
- La cascada no se activa con borrados manuales realizados directamente en Atlas.

## Archivos excluidos

- `.env`
- `node_modules/`
- `material_tecnicatura/`
- `public/uploads/`

Los SVG de documentacion en `public/techretail_*.svg` pueden versionarse.