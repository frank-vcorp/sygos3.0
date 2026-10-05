# UAT — operar como producción sin integraciones

Objetivo: recorrer flujos reales (multiempresa, MOT, cotización, facturación, finanzas, RH, paneles) **sin** Facturapi, SendGrid ni WhatsApp, sin activar Modo de Pruebas por defecto.

Entorno típico: `docker compose up` o despliegue propio con Postgres. Ver [DEPLOY.md](./DEPLOY.md).

## 1. Variables de runtime (UAT)

| Variable | Valor | Notas |
|----------|--------|--------|
| `DATABASE_URL` | URL Postgres | Obligatorio |
| `ENCRYPTION_KEY` | ≥32 chars | Obligatorio |
| **`SYGOS_INTERNAL_FISCAL`** | **`1`** | Emite facturas y nómina fiscal **solo en BD** (folio `internal-*`, sin SAT) |
| `ADMIN_INITIAL_PASSWORD` | vacío tras seed | No dejar en UAT prolongado |
| `SETUP_BOOTSTRAP_KEY` | vacío | Solo emergencia login |
| `QA_VIEW_AS_PASSWORD` | ≥10 chars | Usuarios `qa.*` para «Ver como» |

**No** poner API keys de Facturapi/SendGrid en env ni en integraciones si quieres evitar envíos reales.

En producción real: **nunca** `SYGOS_INTERNAL_FISCAL=1` (ver [PRODUCCION.md](./PRODUCCION.md)).

## 2. Qué hace `SYGOS_INTERNAL_FISCAL`

- Banner violeta **UAT — fiscal interno** (no es Modo de Pruebas).
- Factura / nota de crédito / cancelación: cierran en SYGOS con `fiscalSimulated` y IDs `internal-*`.
- Nómina con salario timbrado: autoriza y genera recibo interno si el colaborador tiene RFC.
- Prueba de integración Facturapi en UI: responde OK explicando modo interno.
- No envía correo ni WhatsApp (integraciones deshabilitadas o sin credenciales).

Los datos persisten en la BD del entorno UAT.

## 3. Usuarios «Ver como» (QA por rol)

```bash
cd web
QA_VIEW_AS_PASSWORD='TuClaveSegura10+' npm run db:seed-demo-view-as
```

Emergencia (con `SETUP_BOOTSTRAP_KEY` temporal): `POST /api/setup/demo-view-as-users` con `setupKey` + `password`.

| Usuario | Rol | Empresa(s) |
|---------|-----|------------|
| `qa.ceo` | CEO | SYSTRON + Servomotores |
| `qa.coordinacion` | Coordinación | Ambas |
| `qa.gerente.systron` | Gerente Op. SYSTRON | SYSTRON |
| `qa.gerente.sm` | Gerente Op. SM | Servomotores |
| `qa.supervisor.systron` | Supervisor técnico | SYSTRON |
| `qa.tecnico.systron` | Técnico | SYSTRON |
| `qa.ventas.systron` | Ventas | SYSTRON |
| `qa.almacen.systron` | Almacén | SYSTRON |
| `qa.ayudante.sm` | Ayudante general SM | Servomotores |
| `qa.kiosco` | Kiosco | SYSTRON |

Login como **Systronia** → header **Ver como** → elegir usuario QA.

## 4. Antes de empezar QA

1. Migraciones al día (`npm run db:migrate` o entrypoint Docker).
2. Login **Systronia** → quitar Modo de Pruebas en `/configuracion/modo-pruebas` salvo pruebas puntuales.
3. Integraciones: dejar **deshabilitadas** o sin credenciales.
4. Checklist: `/configuracion/cierre-e2e` y recorridos `/configuracion/uat-recorridos`.

## 5. Pasar a producción

Ver [PRODUCCION.md](./PRODUCCION.md): **sin** `SYGOS_INTERNAL_FISCAL`, Facturapi por empresa, Modo de Pruebas apagado.
