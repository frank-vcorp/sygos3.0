# Go-live producción (SYGOS 3.0)

Staging actual: https://sygos3-0.systronia.com

## Checklist

1. **Coolify** — Duplicar app o nuevo FQDN prod (ej. `sygos.systronia.com` o dominio cliente).
2. **Secrets** — `DATABASE_URL`, `ENCRYPTION_KEY` (≥32 chars), quitar `ADMIN_INITIAL_PASSWORD` tras seed.
3. **Integraciones** — Facturapi/SendGrid por empresa en UI (no en env del repo).
4. **Modo de pruebas** — Desactivado en producción salvo ventanas controladas.
5. **Migraciones** — El entrypoint ejecuta `npm run db:migrate` en cada deploy.
6. **QA** — Recorrer `/configuracion/cierre-e2e` con el equipo.
7. **Backups** — Activar backup Postgres en Coolify para la BD prod.

## Nómina fiscal

- Colaboradores con salario timbrado requieren **RFC** antes de autorizar nómina.
- Sin Facturapi: autorización bloqueada salvo Modo de Pruebas (simulación).
- Reintento timbrado: borrador con fiscal `ERROR` → botón «Reintentar timbrado».
