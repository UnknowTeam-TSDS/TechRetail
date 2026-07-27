# TechRetail Solutions S.R.L.

[![CI](https://github.com/UnknowTeam-TSDS/TechRetail/actions/workflows/ci.yml/badge.svg)](https://github.com/UnknowTeam-TSDS/TechRetail/actions/workflows/ci.yml)

Plataforma SaaS de e-commerce para PyMEs y emprendedores argentinos. Proyecto académico de la Entrega Final de Desarrollo Web Backend, Grupo 13, IFST 29.

Deploy: [techretail-jc1f.onrender.com](https://techretail-jc1f.onrender.com)

## Funcionalidades

### Administración

- Dashboard con clientes, trials, tiendas, productos, pedidos y MRR.
- Gestión HTML y API REST de planes, add-ons y usuarios.
- Estados de clientes y detección de riesgo de churn.
- Reporte de finanzas y conciliación simulada.
- Notificaciones en tiempo real con Socket.io.

### Cliente

- Registro, login y recuperación del flujo según el estado de la cuenta.
- Prueba gratuita Starter de 15 días, una sola vez.
- Selección y activación simulada de planes.
- Add-on gratuito de onboarding y servicios pagos marcados como próximamente.
- Creación guiada de una tienda, configuración comercial y publicación.
- Catálogo de productos con imágenes, stock, precios, SEO y datos logísticos.
- Gestión de pedidos generados desde la tienda pública.

### Comprador

- Catálogo y detalle público de productos.
- Búsqueda y filtro por categoría.
- Carrito guardado en la sesión del visitante.
- Checkout simulado que registra un pedido y descuenta stock.

## Stack

- Node.js y Express 5.
- MongoDB Atlas y Mongoose 9.
- Pug y Tailwind CSS por CDN.
- express-session y bcryptjs.
- Socket.io.
- multer.
- Jest, Supertest, mongodb-memory-server y ESLint.
- GitHub Actions y Render.

## Arquitectura

El proyecto usa MVC modular:

```text
router -> controller -> storage -> model
                     -> view Pug
```

Módulos principales:

```text
src/modules/
|-- Auth/
|-- Planes/
|-- usuarios/
|-- Tienda/
|-- Productos/
|-- Pedidos/
`-- Finanzas/
```

`app.js` configura middlewares, sesiones, rutas, Socket.io y el servidor HTTP. La conexión a MongoDB se realiza antes de comenzar a escuchar el puerto.

## Instalación

Requisitos: Node.js 20 o superior y MongoDB local o Atlas.

```bash
git clone https://github.com/UnknowTeam-TSDS/TechRetail.git
cd TechRetail
npm install
```

Crear `.env` a partir de `.env.example`:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=una-clave-segura
MONGO_URI=mongodb://localhost:27017/techretail
```

Iniciar:

```bash
npm run dev
```

Abrir `http://localhost:3000/login`.

Admin inicial de desarrollo:

```txt
Email: admin@techretail.com
Password: 123456
```

## Reglas de negocio centrales

- Starter ofrece 15 días de prueba una sola vez.
- Un trial activo o plan pago permite publicar la tienda.
- Una suscripción vencida o cuenta suspendida oculta la tienda al público.
- Los add-ons requieren plan pago; la Guía de Onboarding es gratuita y única.
- Una cuenta creada por un administrador cambia su contraseña en el primer ingreso.
- Cada cliente tiene una sola tienda.
- Productos físicos requieren peso y dimensiones.
- El precio promocional debe ser menor al precio normal.
- Productos y pedidos siempre se filtran por la tienda del cliente.
- El checkout reserva stock y revierte la reserva si no puede completar el pedido.
- Cancelar un pedido repone stock.
- El MRR excluye pruebas gratuitas.

## Rutas principales

| Área | Rutas |
|------|-------|
| Auth | `/login`, `/registro`, `/elegir-plan`, `/mi-cuenta` |
| Admin | `/`, `/planes/vista`, `/usuarios/vista`, `/finanzas` |
| API admin | `/api/planes`, `/api/usuarios` |
| Tienda cliente | `/mi-tienda`, `/mis-productos`, `/mis-pedidos` |
| Tienda pública | `/tienda/:id`, `/tienda/:id/producto/:productoId`, `/tienda/:id/carrito` |
| Checkout | `POST /tienda/:id/checkout` |

## WebSockets

Socket.io se inicializa sobre el mismo servidor HTTP:

```javascript
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);
```

Los controllers emiten mediante `emitirSocket(req, evento, datos)`. El layout administrativo escucha y muestra toasts o refresca el dashboard.

Eventos actuales:

- `nuevo-usuario`
- `nuevo-plan`
- `plan-seleccionado`
- `nueva-tienda`
- `tienda-publicada`
- `nuevo-producto`
- `nuevo-pedido`

## Calidad

Estado verificado localmente:

```txt
18 suites
200 tests
ESLint sin errores
19 vistas Pug compiladas
```

Comandos:

```bash
npm test
npm run lint
npm run test:coverage
```

GitHub Actions ejecuta lint y tests con Node 20 y 22.

La colección Postman está en `src/postman/TechRetail - Test general.postman_collection.json`.

## Renderizado de la documentación

Con LibreOffice y Poppler instalados:

```powershell
.\scripts\render-docx.ps1 `
  -InputPath .\docs\DSWB_Entrega_Final_TechRetail_1C2026_final.docx `
  -OutputDir .\rendered-docx
```

El comando genera un PDF y una imagen PNG por página. La carpeta de salida está ignorada por Git.

## Limitaciones de la entrega

- El cobro es simulado y no procesa dinero real.
- MercadoPago, ARCA y logística real quedan como integraciones futuras.
- Render free usa filesystem efímero; los archivos subidos pueden perderse tras un redeploy.
- La sesión usa MemoryStore, suficiente para la demo de una instancia pero no para producción escalable.
- La cascada de usuario, tienda, productos y pedidos funciona al borrar desde la aplicación/API, no al borrar manualmente en Atlas.

La documentación completa y el guion de defensa están en `docs/`.