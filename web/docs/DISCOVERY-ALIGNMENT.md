# Alineación discovery §12 (gaps cerrados)

Tras migración `0012_discovery_completion`:

| Área | Discovery | Implementación |
|------|-----------|----------------|
| Horas extra | Acumulado semanal 1–9 doble, 10+ triple; empleado no elige tipo | Cálculo en servidor al capturar |
| Vacaciones / asistencia | Días hábiles en calendario al autorizar | Tabla `attendance_daily` |
| Prima vacacional | Reparto por semana de nómina | Solo días de la semana en corrida |
| Nómina → finanzas | Egreso al autorizar | `recordPayrollEgress` (omitido saldo si modo pruebas) |
| Garantía | 6 meses, CEO override, OS garantía, sync intercompañía | `server/ops/warranty.ts` + API comercial |
| Producción técnica | Atribución al validador; gerente SYSTRON excluido | `production-analytics.ts` |
| Comisiones | Histórico por cotización/mes | `quote_total_mxn`, `rate_percent`, `period_key` |
| Modo de pruebas | Folios aislados, purge al finalizar | Snapshots + `test_session_id` + purge |
| Historial funcional | Trazabilidad | `functional_history_entries` + helper |

**Integraciones externas:** Facturapi, SendGrid y WhatsApp siguen siendo configuración por empresa; sin credenciales el sistema opera con política fiscal definida (prod bloquea, staging UAT interno, modo pruebas simula).

**Pendiente menor (UX):** botón en UI de diagnóstico para «Aceptar comercialmente garantía» (API: `POST /api/ops/diagnostics/[id]/warranty-commercial`).
