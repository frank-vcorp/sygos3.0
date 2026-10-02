# Staging UAT — operar como producción sin integraciones

URL: https://sygos3-0.systronia.com

Objetivo: recorrer flujos reales (multiempresa, MOT, cotización, facturación, finanzas, RH, paneles) **sin** Facturapi, SendGrid ni WhatsApp, sin activar Modo de Pruebas por defecto.

## 1. Runtime en Coolify (staging)

| Variable | Valor | Notas |
|----------|--------|--------|
| `DATABASE_URL` | Internal URL Postgres | Obligatorio |
| `ENCRYPTION_KEY` | ≥32 chars | Obligatorio |
| **`SYGOS_INTERNAL_FISCAL`** | **`1`** | Emite facturas y nómina fiscal **solo en BD** (folio `internal-*`, sin SAT) |
| `ADMIN_INITIAL_PASSWORD` | vacío tras seed | No dejar en UAT prolongado |
| `SETUP_BOOTSTRAP_KEY` | vacío | Solo emergencia login |

**No** poner API keys de Facturapi/SendGrid en env ni en integraciones si quieres evitar envíos reales.

En producción real: **nunca** `SYGOS_INTERNAL_FISCAL=1` (ver [PRODUCCION.md](./PRODUCCION.md)).

## 2. Qué hace `SYGOS_INTERNAL_FISCAL`

- Banner violeta **UAT staging** (no es Modo de Pruebas).
- Factura / nota de crédito / cancelación: cierran en SYGOS con `fiscalSimulated` y IDs `internal-*`.
- Nómina con salario timbrado: autoriza y genera recibo interno si el colaborador tiene RFC.
- Prueba de integración Facturapi en UI: responde OK explicando modo interno.
- No envía correo ni WhatsApp (integraciones deshabilitadas o sin credenciales).

Los datos **sí persisten** en la BD de staging (no es sandbox desechable).

## 3. Antes de empezar QA

1. Migraciones al día (deploy ejecuta `db:migrate`).
2. Login **Systronia** → quitar Modo de Pruebas en `/configuracion/modo-pruebas` salvo pruebas puntuales.
3. Integraciones: dejar **deshabilitadas** o sin credenciales.
4. Datos fiscales de prueba en colaboradores con nómina timbrada: RFC genérico de pruebas SAT si aplica a tu proceso.
5. Checklist detallado: `/configuracion/cierre-e2e`.

## 4. Guion por rol (resumen)

| Rol | Rutas clave | Validar |
|-----|-------------|---------|
| Admin / CEO | `/inicio`, `/reportes`, `/configuracion/general` | Multiempresa, autorizaciones, paneles CEO |
| Coordinación | `/paneles/coordinacion` | MOT, pendientes, SLA |
| Gerente SM | `/paneles/gerente-sm` | Validación diagnóstico, horas |
| Técnico | `/paneles/tecnico`, `/operacion/*` | Bitácora, refacciones, producción |
| Finanzas | `/administracion/*`, facturación | CxC/CxP, emitir factura **interna**, pagos |
| RH | `/capital-humano/*` | Asistencia, nómina autorizada, imprimir recibo |
| SYSTRON ops | `/paneles/operacion-systron` | Vista operación central |

Flujos fiscales sin SAT:

- Preferir **remisión** si solo necesitas operación comercial.
- Para probar timbrado lógico: emitir **factura** → debe quedar EMITIDA con aviso de simulación interna.
- Nómina: corrida → autorizar → `/capital-humano/nomina/[id]/imprimir`.

## 5. Diferencia vs Modo de Pruebas

| | Modo de Pruebas | `SYGOS_INTERNAL_FISCAL` |
|--|-----------------|-------------------------|
| Banner | Ámbar “MODO DE PRUEBAS” | Violeta “UAT staging” |
| Alcance | Empresa o sesión por usuario | Todo el servidor staging |
| Uso | Capacitación / prueba por rol | UAT integral pre-prod |

Puedes combinar ambos; en staging UAT normalmente **solo** fiscal interno.

## 6. Limitaciones conocidas (sin integraciones)

- CFDI no válido ante SAT (solo registro interno).
- Movimientos financieros automáticos post-nómina pueden estar simplificados (ver discovery).
- Algunas pantallas aún usan IDs en URL (p. ej. producción por OS).

## 7. Pasar a producción

1. App Coolify nueva o FQDN prod, **sin** `SYGOS_INTERNAL_FISCAL`.
2. Configurar Facturapi por empresa.
3. Modo de Pruebas apagado.
4. Recorrer [PRODUCCION.md](./PRODUCCION.md) y cierre E2E en prod con timbrado real.
