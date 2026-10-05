# SYGOS 3.0

ERP operativo multiempresa (SYSTRON / Servomotores).

- **Fuente funcional:** [SYGOS_3.0_DISCOVERY_FUNCIONAL_VALIDADO.md](./SYGOS_3.0_DISCOVERY_FUNCIONAL_VALIDADO.md)
- **Repositorio:** https://github.com/frank-vcorp/sygos3.0

## Estructura

| Ruta | Descripción |
|------|-------------|
| `web/` | Aplicación Next.js (UI + API) |
| `Marca/` | Activos de marca |
| `docker-compose.yml` | Postgres, Redis y app (desarrollo / despliegue de referencia) |

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

## Despliegue y UAT

- Variables y Docker: [web/docs/DEPLOY.md](./web/docs/DEPLOY.md)
- UAT sin integraciones externas: [web/docs/UAT.md](./web/docs/UAT.md)
- Producción: [web/docs/PRODUCCION.md](./web/docs/PRODUCCION.md)

## Madurez funcional

Discovery §12: [`web/docs/DISCOVERY-12-CHECKLIST.md`](web/docs/DISCOVERY-12-CHECKLIST.md) y [`SYGOS_3.0_PLAN_VALIDACION_FINAL.md`](SYGOS_3.0_PLAN_VALIDACION_FINAL.md).

Sign-off: recorridos R-01…R-22 en `/configuracion/uat-recorridos`.
