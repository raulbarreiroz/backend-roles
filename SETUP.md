# Setup — Biblioteca API (junior)

## Requisitos
- Node.js 18+
- npm

## Pasos

```bash
cp .env.example .env
npm install
npm run setup    # prisma generate + db push + seed
npm run dev      # http://localhost:3000
```

Usuario de prueba (seed):
- email: `bibliotecario@local.dev`
- password: `libros123`

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | no | Alta de usuario |
| POST | `/auth/login` | no | Obtiene JWT |
| GET/POST | `/api/autores` | JWT | Listar / crear autores |
| GET/PUT/DELETE | `/api/autores/:id` | JWT | Detalle / editar / borrar |
| GET/POST | `/api/libros` | JWT | Listar / crear libros |
| GET/PUT/DELETE | `/api/libros/:id` | JWT | Detalle / editar / borrar |
| GET/POST | `/api/prestamos` | JWT | Listar / crear préstamos |
| PATCH | `/api/prestamos/:id/devolver` | JWT | Marcar devolución |

Ejemplo de login:

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bibliotecario@local.dev","password":"libros123"}'
```

Luego usa el token: `Authorization: Bearer <token>`.

## Notas
- Persistencia: SQLite vía Prisma (`prisma/dev.db`).
- Validación: Zod en middlewares.
- Auth: bcryptjs + JWT (jsonwebtoken).
