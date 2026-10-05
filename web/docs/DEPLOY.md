# Despliegue (Docker / servidor propio)

SYGOS 3.0 no depende de un proveedor de PaaS concreto. Referencia: `docker-compose.yml` en la raíz del repo.

## Servicios

- **web** — Next.js (`web/Dockerfile`), puerto 3000
- **postgres** — PostgreSQL 16
- **redis** — Redis 7 (reservado para evolución)

## Variables obligatorias (runtime)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión Postgres |
| `ENCRYPTION_KEY` | ≥32 caracteres (secretos en BD) |

Opcionales habituales:

| Variable | Uso |
|----------|-----|
| `ADMIN_INITIAL_PASSWORD` | Solo primer `db:seed` (usuario Systronia) |
| `QA_VIEW_AS_PASSWORD` | Seed usuarios `qa.*` |
| `SETUP_BOOTSTRAP_KEY` | Endpoints de recuperación (`/api/setup/*`); dejar vacío en prod |
| `SYGOS_INTERNAL_FISCAL` | `1` solo en UAT pre-prod ([UAT.md](./UAT.md)) |

El entrypoint del contenedor ejecuta migraciones antes de arrancar la app.

## Local rápido

```bash
docker compose up -d postgres redis
cd web && npm install && npm run db:migrate && npm run db:seed && npm run dev
```

## Producción

Checklist: [PRODUCCION.md](./PRODUCCION.md).
