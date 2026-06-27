# Guion de presentación — TechRetail Solutions

Guía para la defensa final del proyecto con la profesora. El grupo (4 integrantes) se
divide por especialidad. El orden cuenta una historia: **contexto → datos → servidor → interfaz → calidad**.

Tiempo total estimado: ~17–18 min. Cada uno domina su parte **pero entiende el todo**
(la profe suele cruzar preguntas). Recomendado: demos en vivo con la app de Render y el
código abierto en el editor.

---

## 1. Backend & Arquitectura  *(abre · ~5–6 min)*
**Responsable:** ________________

Arranca con el **contexto** (1 min):
- Qué es TechRetail: SaaS de e-commerce para PyMEs → **panel admin** + **panel cliente** + **tienda pública**.
- Stack: Node + Express 5, MongoDB Atlas + Mongoose, Pug + Tailwind, express-session + bcrypt.
- **Patrón MVC modular**: `router → controller → storage → model → views` (mostrar `src/modules/`).

Luego, tu parte:
- `app.js`: montaje de middlewares, sesiones y routers. Deploy en **Render** + variables de entorno.
- Rutas: **vistas (PRG)** vs **API REST**. Códigos HTTP (200 / 302 / 400 / 401 / 403 / 404 / 500).
- Controllers con **async/await** y lógica de negocio: **trial vs plan pago**, **publicar/despublicar tienda**, add-ons.
- Middlewares: `verificarSesion`, `verificarAdmin`, `logger`.
- **Seguridad**: sesiones, bcrypt, política de contraseña segura, guard de `tiendaId` (un cliente no toca productos de otro).
- **WebSockets (lado servidor)**: `io.emit` al crear plan/usuario.

---

## 2. Base de datos  *(~4 min)*
**Responsable:** ________________

- Mongoose + MongoDB: qué es NoSQL, schemas.
- Los **4 modelos**: `Usuario`, `Plan`, `Tienda`, `Producto` (mostrar los schemas).
- **Validaciones**: `required`, `enum`, `min` / `maxlength`, `match` (regex), `unique`.
- **Relaciones** con `ref` + `populate`: Usuario→Plan, Usuario→addons[], Tienda→Usuario, Producto→Tienda.
- **Hook** `pre('save')` que hashea la contraseña con bcrypt + `select: false`.
- Capa `storage/` (aísla el acceso a datos), el `seed.js` y operadores (`$addToSet`, `$pull`, `distinct`, `countDocuments`).

---

## 3. Frontend  *(~4 min)*
**Responsable:** ________________

- Pug: `layout` + `extends/block` y vistas standalone; Tailwind (CDN), responsive.
- Pantallas: login, dashboard, mi-cuenta, mi-tienda, **storefront público** + ficha de producto.
- **Interactividad**: toasts en tiempo real + auto-refresh (WebSocket cliente), validaciones de formulario en español, checklist de contraseña, **PWA** (instalable + service worker + offline).
- Estados visuales: trial, publicada / "Próximamente", **vista previa del dueño**.

---

## 4. Tester / Calidad  *(~4 min)*
**Responsable:** ________________

- Jest: **97 tests** → modelos (validaciones), controllers (con `jest.mock`), middleware, `passwordPolicy`.
- Por qué se mockea el `storage`: tests rápidos y aislados, sin tocar la base real.
- **CI con GitHub Actions**: corre los tests en cada push/PR, en Node 20 y 22 → mostrar el **badge** y la pestaña *Actions*.
- Cómo correr: `npm test`.

---

## ⚠️ Coordinar para no pisarse
- **WebSockets**: Backend explica el `emit`, Frontend explica el toast que llega.
- **PRG**: Backend lo implementa (redirect), Frontend explica el beneficio de UX.

## 💡 Tips finales
- Tener la app de Render abierta para demos en vivo.
- Tener el código abierto en el editor para mostrar archivos clave.
- Anticipar preguntas cruzadas: cada uno debe poder ubicar dónde "engancha" su parte con las demás.
