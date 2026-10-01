# SYGOS 3.0

ERP operativo multiempresa (SYSTRON / Servomotores).

- **Fuente funcional:** [SYGOS_3.0_DISCOVERY_FUNCIONAL_VALIDADO.md](./SYGOS_3.0_DISCOVERY_FUNCIONAL_VALIDADO.md)
- **Repositorio:** https://github.com/frank-vcorp/sygos3.0

## Estructura

| Ruta | Descripción |
|------|-------------|
| `web/` | Aplicación Next.js (UI + API en evolución) |
| `Marca/` | Activos de marca |
| `docker-compose.yml` | Postgres, Redis, app (desarrollo / referencia Coolify) |

## Desarrollo local

```bash
docker compose up -d postgres redis
cd web
cp .env.example .env.local
# Editar .env.local: ENCRYPTION_KEY (32+ chars) y ADMIN_INITIAL_PASSWORD para seed
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir http://localhost:3000 → **Systronia** → cambio de contraseña obligatorio → `/inicio`.

## Scaffolding vs producto

**Scaffolding** = armazón inicial: proyecto, Docker, login y shell según mockups, sin módulos de negocio completos ni auth real.

Próximos pasos: PostgreSQL, auth Systronia, RBAC, Configuración, maestros Fase 1.
