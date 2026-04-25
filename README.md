# TechRetail Solutions S.R.L.
### Plataforma SaaS de E-Commerce Emprendedores Digitales

---

## UnknowTeam

| Integrante | Rol |
|---|---|
| Melchiori Leandro | ---- |
| Zarate Carlos | ---- |
| Navarro Javier | ---- |
| Choque Heber | ---- |

---

## Descripción del Proyecto

TechRetail Solutions S.R.L. es una startup tecnológica fundada en 2025 en Buenos Aires, Argentina, orientada al segmento B2B. Su producto principal es una **plataforma SaaS de e-commerce** diseñada específicamente para emprendedores digitales argentinos que buscan vender online, automatizar su gestión de stock, pagos y envíos, y tener presencia web profesional sin depender de plataformas internacionales costosas.

La plataforma se posiciona como una alternativa local a Shopify y Tienda Nube, con precios en ARS, soporte en español 24/7, e integraciones nativas con medios de pago y logística locales (MercadoPago, Correo Argentino, Andreani, OCA).

El modelo de negocio combina suscripciones mensuales en tres niveles (Starter, Growth y Pro), comisiones por transacción y módulos adicionales opcionales (add-ons) como analytics avanzado, dominio propio y soporte prioritario con SLA garantizado.

La infraestructura es 100% cloud-native sobre AWS São Paulo con CDN Cloudflare, y el go-to-market se basa en un modelo PLG (Product-Led Growth) con trial gratuito de 14 días y un programa de agencias web certificadas como canal de distribución.

---

## Estructura del Proyecto

```
techretail/
├── app.js                          ← Punto de entrada del servidor
├── package.json
├── README.md
└── src/
    ├── models/
    │   ├── Plan.js                 ← Clase POO: Plan de suscripción
    │   └── Usuario.js              ← Clase POO: Usuario/cliente
    ├── storage/
    │   ├── planesStorage.js        ← Persistencia JSON - Planes
    │   └── usuariosStorage.js      ← Persistencia JSON - Usuarios
    ├── controllers/
    │   ├── planesController.js     ← Lógica de negocio - Planes
    │   └── usuariosController.js   ← Lógica de negocio - Usuarios
    ├── routers/
    │   ├── planesRouter.js         ← Rutas - Planes
    │   └── usuariosRouter.js       ← Rutas - Usuarios
    ├── middlewares/
    │   └── logger.js               ← Middleware: log de requests HTTP
    ├── data/
    │   ├── planes.json             ← Base de datos JSON - Planes
    │   └── usuarios.json           ← Base de datos JSON - Usuarios
    └── views/
        ├── layout.pug              ← Layout base (herencia Pug)
        ├── index.pug               ← Vista: inicio
        ├── planes.pug              ← Vista: catálogo de planes
        └── usuarios.pug            ← Vista: clientes registrados
```

---

## Instalación y Ejecución

### Requisitos previos
- [Node.js](https://nodejs.org) v18 o superior (incluye npm)

### Pasos

```bash
# 1. Clonar o descomprimir el proyecto y entrar a la carpeta
cd techretail

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor
node app.js
```

El servidor queda disponible en **http://localhost:3000**

---

## 🌐 Rutas disponibles

### Vistas HTML (motor Pug + Tailwind CSS)

| Ruta | Descripción |
|---|---|
| `GET /` | Página de inicio con acceso a los módulos |
| `GET /planes/vista` | Catálogo de planes y add-ons con formulario de alta |
| `GET /usuarios/vista` | Listado de clientes con formulario de registro |

### API REST — Módulo Planes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/planes` | Listar todos los planes |
| GET | `/api/planes/:id` | Obtener plan por ID |
| POST | `/api/planes` | Crear nuevo plan |
| PUT | `/api/planes/:id` | Actualizar plan existente |
| DELETE | `/api/planes/:id` | Eliminar plan |

**Body para POST/PUT (JSON):**
```json
{
  "nombre": "Plan Starter",
  "descripcion": "Descripción del plan",
  "precio": 12000,
  "tipo": "plan"
}
```
> Valores válidos para `tipo`: `plan` / `addon`

### API REST — Módulo Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/usuarios` | Listar todos los usuarios |
| GET | `/api/usuarios/:id` | Obtener usuario por ID |
| POST | `/api/usuarios` | Registrar nuevo usuario |
| PUT | `/api/usuarios/:id` | Actualizar datos de usuario |
| DELETE | `/api/usuarios/:id` | Eliminar usuario |

**Body para POST/PUT (JSON):**
```json
{
  "nombre": "María González",
  "email": "maria@empresa.com",
  "plan": "Starter",
  "empresa": "Mi Empresa"
}
```
> Planes válidos: `Starter` / `Growth` / `Pro`

---

## Conceptos aplicados

### Programación Orientada a Objetos (POO)
Las clases `Plan` y `Usuario` encapsulan los datos y comportamientos de cada entidad:
- `esValido()`: verifica que los campos requeridos estén presentes
- `resumen()`: retorna una representación legible del objeto
- `getPrecioMensual()` (Usuario): retorna el precio según el plan contratado
- IDs autoincrementales generados a partir del máximo existente en el JSON

### Módulos Node.js
Cada capa es un módulo independiente con `require` / `module.exports`, siguiendo el patrón **MVC**:
- **Model**: clases POO con lógica de negocio
- **Storage**: lectura y escritura en disco con `fs`
- **Controller**: manejo de requests y responses
- **Router**: definición de rutas y métodos HTTP

### Persistencia en JSON
Se utilizan los módulos nativos `fs.readFileSync` y `fs.writeFileSync` para leer y escribir los archivos `planes.json` y `usuarios.json` como base de datos local.

### Rutas dinámicas
Las rutas con parámetros como `/api/planes/:id` permiten operar sobre recursos individuales usando el ID como identificador.

### Middleware
`logger.js` es un middleware personalizado que intercepta **todas las requests** antes de que lleguen a las rutas, registrando en consola el método HTTP, la URL y el timestamp en formato argentino.

```
[25/4/2026, 01:54:47] GET /planes/vista
[25/4/2026, 01:57:10] POST /api/usuarios
```

### Motor de plantillas Pug
Las vistas usan **herencia de layouts** con `extends layout` y `block contenido`. El layout base incluye el header, la navegación y el footer. Cada vista solo define su contenido específico.

---

## Pruebas con ThunderClient

Ejemplos de requests para documentar como evidencia:

| # | Método | URL | Body |
|---|---|---|---|
| 1 | GET | `http://localhost:3000/api/planes` | — |
| 2 | GET | `http://localhost:3000/api/planes/1` | — |
| 3 | POST | `http://localhost:3000/api/planes` | `{ "nombre": "Plan Enterprise", "descripcion": "Para grandes empresas", "precio": 95000, "tipo": "plan" }` |
| 4 | PUT | `http://localhost:3000/api/planes/1` | `{ "precio": 13500 }` |
| 5 | DELETE | `http://localhost:3000/api/planes/3` | — |
| 6 | GET | `http://localhost:3000/api/usuarios` | — |
| 7 | POST | `http://localhost:3000/api/usuarios` | `{ "nombre": "Juan López", "email": "juan@tienda.com", "plan": "Growth", "empresa": "Mi Tienda" }` |
| 8 | GET | `http://localhost:3000/api/usuarios/9999` | — *(prueba 404)* |

---

## Bibliografía

- Documentación oficial de Node.js: https://nodejs.org/en/docs
- Documentación oficial de Express.js: https://expressjs.com/en/guide/routing.html
- Documentación de Pug: https://pugjs.org/api/getting-started.html
- Tailwind CSS CDN: https://tailwindcss.com/docs/installation/play-cdn
- MDN Web Docs — JavaScript Classes: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
- MDN Web Docs — fs (File System): https://nodejs.org/api/fs.html
---

*© 2025 TechRetail Solutions S.R.L.*
