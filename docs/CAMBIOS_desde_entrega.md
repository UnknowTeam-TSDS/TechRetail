# Cambios desde la segunda entrega

Este archivo resume qué debe reflejar la documentación final de TechRetail. El estado fue verificado con 18 suites, 200 tests, ESLint sin errores y 19 vistas Pug compiladas.

## Evolución funcional

- Registro público, login y redirecciones por rol/estado de suscripción.
- Trial Starter de 15 días y de uso único.
- Activación simulada de planes pagos.
- Cambio obligatorio de contraseña para clientes creados por admin o API.
- Dashboard con clientes, trials activos/vencidos, churn, tiendas, productos, pedidos y MRR.
- Tienda guiada, medios de pago/envío, datos legales y publicación.
- Productos con categorías, edición, imágenes, promociones, SEO y logística.
- Storefront público, carrito por sesión y checkout persistido.
- Pedidos con stock, confirmación, cancelación y reposición.
- Finanzas con ingresos recurrentes y conciliación simulada.
- Socket.io para avisos operativos en tiempo real.
- PWA básica, mensajes flash y páginas de error diferenciadas.

## Reglas corregidas en el cierre

### Suscripción

- `src/utils/suscripcion.js` centraliza trial, plan pago y suscripción activa.
- El trial dura 15 días y no puede reiniciarse.
- Starter se puede activar con pago simulado después del trial.
- Una tienda publicada solo es pública mientras su dueño tenga trial activo o plan pago y la cuenta esté activa.
- El MRR y Finanzas excluyen trials y cuentas sin suscripción activa.

### Pedidos y stock

- El stock físico se reserva antes de crear el pedido.
- Si una reserva o el alta del pedido falla, se revierte lo ya descontado.
- Cancelar repone stock; un pedido cancelado es terminal.
- La confirmación pública exige la sesión compradora original o ser dueño de la tienda.
- Ventas confirmadas suma únicamente pedidos confirmados.

### Integridad

- Eliminar un usuario desde panel/API elimina tienda, productos y pedidos asociados.
- El borrado manual en Atlas no ejecuta esta regla de aplicación.
- No se puede eliminar un plan o add-on asignado a clientes.
- ObjectId se valida en rutas administrativas, tienda, productos, carrito y pedidos.
- La API no acepta guardar una contraseña en texto plano mediante actualización genérica.

### Inicio y producción

- La aplicación espera la conexión a MongoDB antes de escuchar el puerto.
- Un fallo de MongoDB detiene el inicio.
- `SESSION_SECRET` es obligatorio con `NODE_ENV=production`.
- El hash de contraseña no se serializa en JSON.

## Arquitectura actual

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

Colecciones: `usuarios`, `plans`, `tiendas`, `productos`, `pedidos`.

Helpers compartidos:

- `src/utils/helpers.js`: WebSocket, flash y errores.
- `src/utils/suscripcion.js`: estado unificado de suscripción.

## WebSockets

`app.js` crea `http.createServer(app)` y `new Server(server)`, guarda la instancia como `app.set('io', io)` y los controllers emiten mediante `emitirSocket()`.

Eventos: `nuevo-usuario`, `nuevo-plan`, `plan-seleccionado`, `nueva-tienda`, `tienda-publicada`, `nuevo-producto` y `nuevo-pedido`.

Su beneficio es avisar al administrador sin polling ni refresco manual. MongoDB sigue siendo la fuente de verdad.

## Testing y calidad

- Modelos: Plan, Usuario, Tienda, Producto y Pedido.
- Controllers: Auth, Planes, Usuarios, Tienda, Productos, Pedidos y Finanzas.
- Middleware: autenticación y ObjectId.
- Utilidades: política de contraseña y suscripción.
- Storage: cascada de usuarios.
- Integración: rutas, sesión, 404 y flujo auth.
- CI: lint y tests en Node 20 y 22.

## Limitaciones documentadas

- Checkout y pagos simulados.
- Add-ons pagos todavía no contratables.
- Sin pasarela, ARCA ni courier real.
- Uploads efímeros en Render free.
- MemoryStore no escala a múltiples procesos ni persiste sesiones.
- Sin tokens CSRF específicos.