# Go-live producción (SYGOS 3.0)

## Checklist

1. **Infra** — Contenedor o VM con Postgres dedicado, TLS en el reverse proxy, dominio del cliente.
2. **Secrets** — `DATABASE_URL`, `ENCRYPTION_KEY` (≥32 chars), quitar `ADMIN_INITIAL_PASSWORD` tras seed. **No** usar `SYGOS_INTERNAL_FISCAL` (solo UAT; ver [UAT.md](./UAT.md)).
3. **Integraciones** — Facturapi/SendGrid por empresa en UI (no en el repo).
4. **Modo de pruebas** — Desactivado en producción salvo ventanas controladas.
5. **Migraciones** — Ejecutar `npm run db:migrate` en cada release (automático en Docker entrypoint).
6. **QA** — Recorrer `/configuracion/uat-recorridos` y `/configuracion/cierre-e2e` en el entorno previo a prod.
7. **Backups** — Política de backup Postgres acorde al SLA del cliente.

## Nómina fiscal

- Colaboradores con salario timbrado requieren **RFC** antes de autorizar nómina.
- Sin Facturapi: autorización bloqueada salvo Modo de Pruebas (simulación).
- Reintento timbrado: borrador con fiscal `ERROR` → botón «Reintentar timbrado».
