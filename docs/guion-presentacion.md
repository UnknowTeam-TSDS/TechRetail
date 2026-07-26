# Guion de defensa backend - TechRetail Solutions

Duración sugerida: 8 a 10 minutos. Tener abierto el deploy, una sesión admin, una sesión cliente y el editor.

## 1. Apertura (40 segundos)

### Decir

"TechRetail es una plataforma SaaS de e-commerce para PyMEs argentinas. El backend cubre tres actores: el administrador de TechRetail, el dueño de una tienda y el comprador público. La aplicación está construida con Node.js, Express 5, MongoDB Atlas y Mongoose. Las vistas usan Pug, la autenticación usa sesiones y bcrypt, y Socket.io agrega comunicación en tiempo real."

### Mostrar

- Deploy de Render.
- `src/modules/` en el editor.

## 2. Arquitectura MVC modular (50 segundos)

### Decir

"Organizamos el proyecto por módulos. El router define la URL y sus middlewares; el controller recibe la petición y aplica la regla de negocio; el storage concentra las consultas a MongoDB; el model valida la estructura; y la vista Pug genera HTML. Esto evita tener toda la lógica en app.js y permite probar cada capa de forma aislada."

### Mostrar

- `src/modules/Tienda/routers/tiendaRouter.js`.
- `src/modules/Tienda/controllers/tiendaController.js`.
- `src/modules/Tienda/storage/tiendaStorage.js`.
- `src/modules/Tienda/models/Tienda.js`.

## 3. Inicio, sesión y seguridad (1 minuto)

### Decir

"app.js configura Express, archivos estáticos, parseo de formularios, logger y sesiones. En producción exigimos SESSION_SECRET y esperamos la conexión con Atlas antes de abrir el puerto. Las contraseñas se hashean con bcrypt en un hook pre-save y el campo usa select false. Solo el login lo solicita con select más contraseña. También aplicamos rate limit, cookies httpOnly, sameSite lax y middlewares verificarSesion y verificarAdmin."

"Las cuentas creadas por un administrador o por la API deben cambiar su contraseña en el primer ingreso. Las rutas con identificadores validan ObjectId para evitar CastError y devolver 404 o 400 correctamente."

### Mostrar

- Configuración de sesión en `app.js`.
- `src/modules/usuarios/models/Usuario.js`.
- `src/middlewares/autenticacion.js`.
- `src/middlewares/validarObjectId.js`.

## 4. La variable io y WebSockets (1 minuto 30 segundos)

### Decir

"Express por sí solo maneja HTTP. Socket.io necesita trabajar sobre el servidor HTTP real. Por eso creamos server con http.createServer(app) y después creamos io con new Server(server). La variable io representa el servidor de Socket.io: mantiene las conexiones abiertas y permite emitir eventos a los navegadores conectados."

"Guardamos esa instancia con app.set('io', io). De esa forma no necesitamos importar app.js dentro de cada controller. Desde una request recuperamos la misma instancia con req.app.get('io'). Nuestro helper emitirSocket hace esa operación y emite solo si la instancia existe, lo cual facilita los tests."

"Cuando un controller termina una operación persistida, por ejemplo crear un producto, ejecuta emitirSocket con el evento nuevo-producto. El layout administrativo se conecta con io(), escucha socket.on y muestra un toast o actualiza el panel. La base sigue siendo la fuente de verdad; WebSocket solo entrega el aviso inmediato."

### Mostrar en código

1. `app.js`: `http.createServer(app)`, `new Server(server)`, `app.set('io', io)` y `io.on('connection')`.
2. `src/utils/helpers.js`: `emitirSocket`.
3. `src/modules/Productos/controllers/productosController.js`: `nuevo-producto` después del guardado.
4. `src/modules/Tienda/controllers/tiendaController.js`: `nueva-tienda` y `tienda-publicada`.
5. `src/modules/Pedidos/controllers/pedidosController.js`: `nuevo-pedido`.
6. `src/views/layout.pug`: listeners del cliente.

### Demo

- Pestaña 1: dashboard admin.
- Pestaña 2: cliente.
- Crear una tienda, producto o pedido.
- Volver al admin y señalar la notificación sin recargar.

### Beneficios a explicar

- Menor latencia que polling periódico.
- Menos requests innecesarias.
- Mejor monitoreo operativo.
- Un mismo canal sirve para varios eventos.
- Desacopla la acción del cliente de la interfaz admin.

## 5. Lógica de suscripción (1 minuto)

### Decir

"Centralizamos la suscripción en src/utils/suscripcion.js para no repetir condiciones distintas en cada módulo. Starter ofrece 15 días gratis una sola vez. trialUtilizado evita reiniciar la prueba. Cuando vence, el cliente puede activar Starter mediante pago simulado, pero ya no obtiene otro trial."

"Una suscripción está activa si la cuenta está activa y tiene trial vigente o plan pago. Esa misma regla controla la tienda pública, el dashboard, Finanzas y los add-ons. El MRR excluye trials."

### Mostrar

- `src/utils/suscripcion.js`.
- `seleccionarPlan` en Auth controller.
- Campos `trialHasta` y `trialUtilizado` en Usuario.

## 6. Lógica de tienda (1 minuto)

### Decir

"Cada cliente tiene una sola tienda porque usuarioId es único. La tienda nace en construcción. Para publicar se exigen identidad comercial, datos legales, al menos un producto y una suscripción activa. Puede publicarse durante el trial; si el trial vence o la cuenta queda suspendida, deja de estar disponible para compradores externos."

"El dueño autenticado puede seguir usando la vista previa aunque la tienda no sea pública. Esa distinción se resuelve comparando el usuario de sesión con el dueño de la tienda. La URL pública no confía solo en estado activa: también vuelve a validar la suscripción del dueño."

### Mostrar

- Modelo Tienda.
- `publicarTienda`.
- `vistaPublicaTienda` y `vistaPublicaProducto`.
- Deploy con una tienda publicada y luego vista previa.

## 7. Productos, carrito y pedidos (1 minuto 20 segundos)

### Decir

"Todo acceso a productos filtra por tiendaId. Aunque un usuario cambie el ID de la URL, no puede modificar productos ajenos. Los productos físicos requieren peso y dimensiones; los digitales o servicios no. El precio promocional debe ser menor al normal. Las imágenes se procesan con multer y la UI tiene placeholder porque Render free usa disco efímero."

"El carrito vive en la sesión del comprador y pertenece a una tienda. No mezcla productos de distintos comercios. El checkout crea un Pedido simulado: no cobra dinero, pero sí persiste la operación. Antes de crear el pedido reservamos stock con una actualización atómica. Si falla un producto o falla el alta del pedido, revertimos las reservas. Cancelar repone stock y un pedido cancelado no puede confirmarse después."

"La confirmación contiene datos del comprador, por eso solo se muestra a la misma sesión que hizo el checkout o al dueño de la tienda."

### Mostrar

- Guardas por `tiendaId` en Productos controller/storage.
- Validación del modelo Producto.
- `procesarCheckout` en Pedidos controller.
- Panel `/mis-pedidos`.

## 8. Persistencia y borrado (40 segundos)

### Decir

"MongoDB no aplica cascadas automáticamente como una base relacional. Por eso, al borrar un usuario desde la aplicación o API buscamos sus tiendas y eliminamos productos, pedidos y tiendas asociados. Si se borra manualmente desde Atlas, esa lógica no se ejecuta. También impedimos eliminar planes o add-ons que todavía estén asignados a clientes."

### Mostrar

- `src/modules/usuarios/storage/usuariosStorage.js`.
- `estaEnUso` en Planes storage.

## 9. Testing y CI (40 segundos)

### Decir

"La versión final tiene 18 suites y 200 tests. Probamos modelos, controllers, middlewares, storage, política de contraseña, suscripción, eventos WebSocket e integración HTTP con Supertest y MongoDB en memoria. ESLint valida calidad estática y GitHub Actions ejecuta lint y tests en Node 20 y 22."

### Mostrar

```bash
npm test
npm run lint
```

- Badge de CI o pestaña Actions.

## 10. Errores reales resueltos (1 minuto)

### Decir

"Durante el desarrollo aparecieron problemas reales de despliegue y lógica:"

- "Render usa Linux y distingue mayúsculas: el módulo era Auth pero el require decía auth. Corregimos el path."
- "La conexión Atlas falló por confundir el número 1 con una letra en el hostname. Verificamos la URI y Network Access."
- "Socket.io no se instaló en Render porque package.json no había entrado en el commit. Se corrigió el commit y el deploy."
- "Pug rompía un if/else porque había un comentario entre las ramas. Reordenamos la plantilla."
- "Un plan populado de Mongoose no se compara con String(documento); usamos su _id."
- "El dashboard no contaba trials porque filtraba planId null, pero Starter guarda plan y trial juntos. Centralizamos la regla."
- "Detectamos tiendas huérfanas al borrar usuarios. Implementamos cascada de aplicación."
- "El checkout podía exponer confirmaciones por ID y dejar stock inconsistente. Agregamos sesión compradora y rollback."

## Cierre (20 segundos)

### Decir

"El resultado no es solo un CRUD: integra autenticación, suscripciones, tienda, catálogo, carrito, pedidos, métricas, seguridad, tiempo real y pruebas. Los pagos siguen simulados y las siguientes etapas serían un store persistente de sesiones, almacenamiento externo de imágenes e integraciones reales con MercadoPago, ARCA y logística."

## Preguntas probables

### ¿Por qué WebSocket y no refrescar cada cinco segundos?

Porque el servidor avisa solo cuando ocurre un evento. Polling genera requests incluso sin cambios y puede demorar hasta el siguiente intervalo.

### ¿io guarda datos?

No. `io` administra conexiones y eventos. Los datos definitivos están en MongoDB.

### ¿Qué pasa si Socket.io falla?

La operación principal ya fue persistida. Se pierde el aviso en tiempo real, no el usuario, producto o pedido.

### ¿El checkout cobra realmente?

No. Persiste un pedido simulado y prueba stock/estados, pero no envía datos a una pasarela ni guarda tarjetas.

### ¿Por qué el trial se guarda como fecha?

Porque permite calcular días restantes comparando `trialHasta` con la fecha actual sin ejecutar un cron diario.

### ¿La cascada funciona al borrar en Atlas?

No. Es una regla del storage de la aplicación. Para borrados externos haría falta una tarea de mantenimiento, trigger o transacción administrada.

### ¿Qué falta para producción real?

Store persistente de sesiones, CSRF dedicado, almacenamiento externo de imágenes, pagos reales, facturación, logística, observabilidad y copias de seguridad operativas.