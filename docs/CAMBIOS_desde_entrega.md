# Cambios posteriores al documento de entrega

Este anexo resume las funcionalidades agregadas **después** de redactar
`DSWB_Entrega_Final_TechRetail_1C2026_actualizada.docx`. Está organizado por las
secciones de ese documento para facilitar volcarlo. Todo lo nuevo mantiene el
patrón MVC modular y está cubierto por tests.

> Estado actual: **171 tests** (16 suites) en verde, **ESLint** sin errores, CI en Node 20 y 22.

---

## Sección 2 — Introducción / "Cambios principales"

Agregar a la lista de cambios:

- **Onboarding guiado de tienda (RF-05)**: panel `/mi-tienda` con barra de progreso y 5 pasos (crear tienda → cargar producto → medios de pago → medios de envío → publicar).
- **Medios de pago y envío configurables** por el dueño (simulados), reflejados en el checkout público.
- **Pedidos simulados persistidos (RF-01)**: el checkout crea una orden real en base de datos, con descuento de stock y ciclo de estados.
- **Alertas de churn (RF-02)**: clientes en riesgo en el dashboard.
- **Reporte de finanzas / conciliación (RF-03)**: MRR, add-ons y ventas simuladas.
- **Feedback al usuario** con mensajes flash (patrón PRG) y **páginas de error con estilo**.
- **Endurecimiento de seguridad**: rate-limit en login, cookie `sameSite`/`secure`, validación de ObjectId.
- **Tests de integración** (supertest + mongodb-memory-server) y **ESLint**.

Con esto quedan cubiertos los cuatro RF del relevamiento de Ingeniería de Software (RF-01 Checkout, RF-02 Churn, RF-03 Conciliación, RF-05 Onboarding).

---

## Sección 4.2 — Funcionalidades principales

**Corregir** el bullet del checkout, que hoy dice *"no genera orden real"*. Ahora:

- Checkout que **registra un pedido simulado** (persistido), descuenta stock de productos físicos y muestra una confirmación al comprador. Sigue sin cobrar dinero real.

**Agregar**:

- Panel de tienda como **onboarding guiado** con progreso y pasos desbloqueables.
- Configuración de **medios de pago** (MercadoPago, transferencia, tarjeta, efectivo) y **medios de envío** (Correo Argentino, OCA, retiro en local, envío gratis con monto mínimo).
- El dueño ve sus pedidos en `/mis-pedidos` y puede **confirmar o cancelar** (cancelar repone stock).
- **Dashboard**: sección de **clientes en riesgo (churn)** y contador de pedidos.
- **Reporte de finanzas** (`/finanzas`, admin): MRR, ingresos por add-ons, ingreso mensual total y ventas por estado de pedido.
- **Búsqueda por texto** en la tienda pública (combinada con filtro por categoría).
- Feedback con **mensajes flash** tras cada acción.

---

## Sección 5 — Módulos del proyecto

**Agregar dos módulos**:

- **Módulo Pedidos**: registra las compras simuladas del checkout público. Rutas: `POST /tienda/:id/checkout`, `GET /tienda/:id/pedido/:pedidoId`, `GET /mis-pedidos`, `POST /mis-pedidos/:id/estado`. Descuenta stock al crear y lo repone al cancelar. Emite `nuevo-pedido` por WebSocket.
- **Módulo Finanzas** (solo admin): `GET /finanzas`. Reporte de conciliación (RF-03) que cruza ingresos recurrentes (planes + add-ons, excluyendo trials) con las ventas simuladas agrupadas por estado.

**Ampliar Módulo Tienda**: onboarding guiado, `POST /mi-tienda/medios-pago` y `POST /mi-tienda/medios-envio`. Catálogo de opciones en `src/modules/Tienda/opcionesComerciales.js`.

---

## Sección 6 — Arquitectura y rutas

- Nuevos directorios: `src/modules/Pedidos/`, `src/modules/Finanzas/`, `src/utils/helpers.js` (helpers compartidos: `emitirSocket`, `flash`, `render404`).
- `app.js` ahora **exporta la app** y solo arranca el servidor con `require.main === module` (para los tests de integración).
- Middleware `validarObjectId(param)` en rutas con `:id`.

Rutas nuevas: `/finanzas` (admin), `/mis-pedidos` y `/mis-pedidos/:id/estado` (cliente), `/tienda/:id/checkout` y `/tienda/:id/pedido/:pedidoId` (público), `/mi-tienda/medios-pago` y `/mi-tienda/medios-envio` (cliente).

---

## Sección 7 — Persistencia de datos

**Agregar la colección `pedidos`** (modelo `Pedido`): `tiendaId`, `items` (copia histórica con `nombre`, `precioUnitario`, `cantidad`, `subtotal`), `total`, `medioPago`, `medioEnvio`, `comprador` (`nombre`, `email`, `telefono`), `estado` (`pendiente|confirmado|cancelado`), `esSimulado`, timestamps.

Ahora son **5 colecciones**: usuarios, plans, tiendas, productos, pedidos. La tienda suma `mediosPago`, `mediosEnvio` y `envioGratisMonto`.

Operadores nuevos: `$inc` (stock), aggregate `$group` (resumen de pedidos por estado para Finanzas).

---

## Sección 8 — Seguridad y control de acceso

**Agregar**:

- `express-rate-limit` en `POST /login` (10 intentos / 15 min por IP) contra fuerza bruta.
- Cookie de sesión con `sameSite: 'lax'` (mitiga CSRF) y `secure` en producción (`trust proxy`).
- `validarObjectId` evita errores 500 por `:id` malformados (devuelve 404 con estilo).
- Páginas de error con estilo para rutas web; JSON solo para `/api/*`.

---

## Sección 9 — Testing, calidad y despliegue

**Actualizar**:

- **171 tests** (16 suites): modelos (Plan, Usuario, Tienda, Producto, Pedido), controllers (auth, productos, tienda, pedidos, usuarios, planes, finanzas), seguridad y middleware.
- **Tests de integración** en `tests/integration/` con `supertest` + `mongodb-memory-server` (rutas end-to-end, sesión, 404, flujo de registro/login).
- **ESLint** (`npm run lint`) con flat config; **cobertura** con `npm run test:coverage`.
- El **CI** ahora corre lint + tests en Node 20 y 22.

---

## Sección 10 — Observaciones para revisión final

**Corregir**: ya no aplica que "no hay colección de órdenes". Ahora:

- El checkout **persiste un pedido simulado** con su ciclo de estados (pendiente → confirmado/cancelado) y ajusta stock, pero **sigue sin procesar dinero real ni integrar pasarelas**.
- Quedan como futuras mejoras: integración real de pagos (MercadoPago), facturación ARCA, logística real y almacenamiento de imágenes en un servicio externo (Cloudinary/S3) por el filesystem efímero de Render.
