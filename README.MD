# Preludio API – Backend de gestión de eventos y ticketing

Backend en Node.js para una plataforma de **gestión de eventos**, **venta de tickets** y **pagos**, pensado para ser consumido por un frontend (SPA) y para ofrecer endpoints claros y consistentes.

La API permite:

- Registrar y autenticar usuarios (con roles **ADMIN** y **USUARIO**).
- Administrar eventos (crear, listar, editar, borrar).
- Vender tickets asociados a eventos y usuarios.
- Registrar pagos de tickets (checkout).
- Gestionar reseñas de la aplicación (una por usuario).
- Exponer listados con **paginación, orden y búsqueda simple**.

---

## 🧠 ¿Qué hace y cómo funciona?

### Flujo general

1. **Autenticación**
   - Un usuario se registra mediante `/api/auth/register`.
   - El login se realiza en `/api/auth/login`.
   - Se emiten:
     - Un **access token** (JWT de corta duración).
     - Un **refresh token** (JWT de mayor duración).
   - Los tokens se devuelven en **cookies HTTP** y/o en el cuerpo de la respuesta (según el endpoint).

2. **Autorización y roles**
   - El middleware `requireAuth` valida el JWT (en header, cookie o query).
   - `requireRole("ADMIN")` / `roleGate("ADMIN")` restringe endpoints de administración.
   - `req.user` siempre contiene al menos `{ id, rol }` para usar en controladores.

3. **Gestión de usuarios**
   - Modelo `User` con:
     - Datos básicos (`nombre`, `apellido`, `dni`, `email`, `telefono`).
     - `rol` (`ADMIN` | `USUARIO`).
     - Relaciones: `comprasRealizadas` (tickets) y `eventosCreados`.
   - El primer usuario con rol `ADMIN` solo se puede crear si no hay otro admin.

4. **Eventos**
   - Modelo `Event` con:
     - Información básica: título, descripción, fecha/hora.
     - **Ubicación embebida** (`UbicacionSchema`: lugar, dirección, ciudad, provincia, geo opcional).
     - Capacidad, entradas disponibles, estados, categoría, etc.
   - Endpoints permiten:
     - Crear / actualizar / borrar eventos (solo ADMIN).
     - Listar y buscar eventos con filtros (fecha, estado, ubicación, etc.).

5. **Tickets**
   - Modelo `Ticket`:
     - `evento` (ref a `Event`).
     - `comprador` (ref a `User`).
     - `tipoEntrada`, `precioPagado`, `fechaCompra`, `codigoQR` (opcional).
     - `estado` (`VALIDO`, `USADO`, `CANCELADO`).
   - Lógica de negocio en `ticketsController`:
     - Verifica disponibilidad del evento.
     - Descuenta entradas disponibles.
     - Crea ticket y lo agrega a `comprasRealizadas` del usuario.

6. **Pagos**
   - Modelo `Pago`:
     - `ticket` (ref a `Ticket`).
     - `metodo` (`MERCADO_PAGO`, `TARJETA`, `EFECTIVO`).
     - `monto`, `fechaPago`, `estado` (`PENDIENTE`, `COMPLETADO`, `FALLIDO`).
     - `referenciaExterna` (ID de pasarela, ej. Mercado Pago).
   - Endpoint de checkout:
     - Si recibe `ticketId`: usa un ticket existente.
     - Si no, crea un ticket con `createTicketForUser`.
     - Crea un `Pago` asociado y responde el pago con `ticket` y `comprador` populados.

7. **Reseñas**
   - Modelo `Review`:
     - `user` (ref a `User` y `unique`: un usuario solo puede dejar una reseña).
     - `rating` (1 a 5).
     - `comment` (10 a 500 caracteres).
   - Endpoints:
     - Listar todas / paginadas.
     - Obtener mi reseña (`/me/review`).
     - Crear/editar/eliminar mi reseña.
     - ADMIN puede editar/eliminar cualquier reseña.

8. **Paginación y búsqueda**
   - Varios listados (`listUsers`, `listPagos`, `listReviews`, etc.) aceptan:
     - `page` – página actual (1 por defecto).
     - `limit` – registros por página.
     - `sort` – campo por el que se ordena.
     - `order` – `asc` o `desc`.
     - `q` – texto de búsqueda simple sobre ciertos campos.
   - Internamente se calcula:
     - `skip = (page - 1) * limit`.
   - La respuesta incluye siempre al menos:
     - `items` – array de resultados.
     - `total` – cantidad total de registros que matchean el filtro.
     - `page`, `limit`.

---

## 🏗️ Arquitectura del proyecto

Estructura principal:

```txt
server.js
src/
  config/
    db.js          # Conexión y selección de base según entorno
  controllers/
    authController.js
    usersController.js
    eventController.js
    ticketsController.js
    pagosController.js
    reviewController.js
  middlewares/
    auth.js        # requireAuth, requireRole, optionalAuth
  models/
    User.js
    Event.js
    Ticket.js
    Pago.js
    Review.js
    TipoEntrada.js
  routes/
    authRoutes.js
    userRoutes.js
    eventsRoutes.js
    ticketsRoutes.js
    pagosRoutes.js
    reviewRoutes.js
    index.js       # monta /auth, /users, /events, /reviews, /tickets, /pagos
  data/
    users.js       # datos de ejemplo
```

### Flujo de arranque

1. `server.js`:
   - Carga variables de entorno (`dotenv`).
   - Inicializa Express.
   - Conecta a MongoDB mediante `conectarDB()` (`src/config/db.js`).
   - Configura middlewares globales:
     - `cors` con `origin = process.env.FRONT`.
     - `cookieParser` para leer JWT en cookies.
     - `express.json()` para parsear JSON.
   - Monta rutas:
     - `/api` → `apiRouter` (auth, users, events, reviews, tickets, pagos).
   - Levanta el servidor en `PORT`.

2. `conectarDB()`:
   - Usa `MONGODB_URI` (solo cluster, sin nombre de DB).
   - Elige `dbName` según:
     - `APP_ENV` / `NODE_ENV` (`production` vs `staging`).
     - `DB_NAME_PROD` / `DB_NAME_STAGING`.
     - Flag opcional `--db=NombreDB` al ejecutar `node`.
   - Habilita `mongoose.set('strictQuery', true);`.
   - Se conecta y loguea `[DB] conectado a "..." (env=...)`.

3. Middlewares de auth (`src/middlewares/auth.js`):
   - `extractToken` soporta:
     - Header `Authorization: Bearer ...`.
     - Header `x-access-token`.
     - Cookie `token`.
     - Query `?access_token=` / `?token=`.
   - `requireAuth` verifica el JWT y setea `req.user`.
   - `requireRole(...roles)` verifica el rol.
   - `optionalAuth` no falla si no hay token (útil para endpoints públicos).

---

## 🔧 Tecnologías utilizadas

- **Node.js** (ES Modules)
- **Express** – servidor HTTP y ruteo.
- **MongoDB** + **Mongoose** – base de datos y modelos ODM.
- **JWT (jsonwebtoken)** – autenticación basada en tokens.
- **bcryptjs** – hash de contraseñas.
- **dotenv** – configuración mediante `.env`.
- **cors** – configuración de CORS para el frontend.
- **cookie-parser** – lectura de cookies (tokens).
- JavaScript moderno (async/await, import/export, optional chaining, etc.).

---

## ✅ Requisitos previos

- Node.js >= 18 (recomendado).
- MongoDB (local o cluster en Atlas).
- npm o pnpm/yarn (según prefieras).
- Un frontend o herramienta tipo Postman/Insomnia para probar la API.

---

## ⚙️ Configuración de entorno

Crear un archivo `.env` en la raíz del proyecto con, por ejemplo:

```env
# Servidor
PORT=3001
FRONT=http://localhost:5173

# MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net
APP_ENV=staging
DB_NAME_STAGING=preludio_staging
DB_NAME_PROD=preludio_prod

# JWT
JWT_SECRET=super_secret_access_key
JWT_REFRESH_SECRET=super_secret_refresh_key
```

Notas:

- `MONGODB_URI` **no** debe incluir el nombre de la base al final, solo el cluster.
- `APP_ENV` controla qué DB se elige (staging vs production).
- `JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser claves seguras y distintas.

---

## 🏃‍♂️ Cómo ejecutar en local

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

2. **Instalar dependencias**

```bash
npm install
# o
pnpm install
# o
yarn install
```

3. **Configurar `.env`**

Crear el archivo `.env` como se indicó arriba.

4. **Levantar el servidor**

Según cómo tengas definido `package.json`, por ejemplo:

```bash
npm start
# o
node server.js
# o
npm run dev
```

5. **Probar la API**

- Healthcheck:
  - `GET http://localhost:3001/api/health`
- Auth:
  - `POST http://localhost:3001/api/auth/register`
  - `POST http://localhost:3001/api/auth/login`
- Eventos:
  - `GET http://localhost:3001/api/events`
- Tickets:
  - `POST http://localhost:3001/api/tickets`
- Pagos:
  - `POST http://localhost:3001/api/pagos/checkout`

---

## 🔌 Endpoints principales (resumen)

### Autenticación (`/api/auth`)

- `POST /register` – Registro de usuario.
- `POST /login` – Login con email y password (devuelve tokens y user).
- `POST /logout` – Cierra sesión (limpia cookies).
- `GET /me` – Devuelve al usuario autenticado (requiere token).

### Usuarios (`/api/users`)

- `GET /admin` – (ADMIN) listado paginado de usuarios.
- `POST /` – (ADMIN) crear usuario.
- `GET /me` – datos del usuario logueado.
- `PATCH /me` – actualizar datos propios.
- `PUT /me/profile` – actualizar perfil propio.
- `PUT /me/change-password` – cambiar contraseña propia.
- `GET /search` – búsqueda simple de usuarios.
- `GET /:id` – detalle de usuario (según permisos).
- `PUT /:id` – (ADMIN) actualizar usuario por ID.

### Eventos (`/api/events`)

- `GET /` – listar/buscar eventos con filtros y paginación.
- `GET /:id` – detalle de evento.
- `POST /` – (ADMIN) crear evento.
- `PUT /:id` – (ADMIN) actualizar evento.
- `DELETE /:id` – (ADMIN) eliminar evento.

### Tickets (`/api/tickets`)

- `POST /` – crear ticket (compra usuario o creación por admin).
- `GET /` – listar tickets del usuario autenticado.
- `GET /:id` – obtener ticket por ID.

### Pagos (`/api/pagos`)

- `POST /checkout` – crear pago asociado a un ticket (y opcionalmente crear el ticket).
- `GET /:id` – obtener pago por ID.
- `GET /list` – listado paginado de todos los pagos (solo ADMIN).
- `GET /` – listado paginado de mis pagos (usuario logueado).

### Reseñas (`/api/reviews`)

- `GET /` – obtener todas las reseñas (sin paginación).
- `GET /list` – listar reseñas con paginación y búsqueda.
- `GET /:id` – obtener reseña por ID.
- `GET /me/review` – obtener mi reseña.
- `POST /` – crear mi reseña (solo una por usuario).
- `PUT /me` – actualizar mi reseña.
- `DELETE /me` – eliminar mi reseña.
- `PUT /:id` – (ADMIN) actualizar reseña de cualquier usuario.
- `DELETE /:id` – (ADMIN) eliminar reseña de cualquier usuario.

---

## 🔑 Credenciales de prueba (completar)

```text
ADMIN
- Email: admin@preludio.com
- Password: Password01!

USUARIO
- Email: usuario@preludio.com
- Password: Password01!
```
