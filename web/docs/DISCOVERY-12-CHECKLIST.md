# Discovery §12 — Checklist de cierre

Referencia: `SYGOS_3.0_DISCOVERY_FUNCIONAL_VALIDADO.md` §12.1–12.6.

**Leyenda:** ✅ Lógica/handoffs en código · 🧪 **Sign-off UAT obligatorio** (recorridos R-01…R-22 en `/configuracion/uat-recorridos` + guion en `SYGOS_3.0_PLAN_VALIDACION_FINAL.md`)

> **100 % discovery funcional** = todos los recorridos UAT pasan con rol correcto, estados, handoffs y relaciones navegables. Las bandejas/UX solas no cuentan como cierre.

## §12.1 Completitud de módulo

Para entidades principales (Cliente, Prospecto, Proveedor, EQUI, MOT, Diagnóstico, OS, Cotización, Factura, Pago, Compra, O.C., Colaborador, Nómina):

| Criterio | Estado |
|----------|--------|
| Rutas de creación | ✅ |
| Campos por momento | ✅ (formularios + API) |
| Listado, búsqueda, filtros | ✅ / búsqueda global en header |
| Detalle por folio/nombre | ✅ (producción OS por folio `OS-n`) |
| Acciones por estado/rol | ✅ RBAC + paneles |
| Relaciones navegables | ✅ enlaces en detalle |
| Automatizaciones / handoffs | ✅ cotizar, CxC, intercompañía, nómina |
| Documentos / impresión | ✅ cotización, nómina, fiscal |
| Errores y reintentos | ✅ fiscal, nómina fiscal |
| Historial funcional | ✅ `functional_history_entries` + panel en diagnóstico |

## §12.2 Criterios de aceptación

### Multiempresa — ✅

Contexto activo, datos separados, MOT global, búsqueda global acotada, sin dashboard consolidado.

### EQUI/MOT y custodia — ✅

Custodia SYSTRON/SM, SLA al ingreso, salida a prueba, egreso definitivo (`paid_physical_exit_at` para garantía).

### Diagnóstico y reparación — ✅

Validación gerente, devolución con motivo + historial, prioridad congelada, refacciones → `EN_ESPERA_REFACCIONES` / surtido → `EN_REPARACION`.

### MOT intercompañía — ✅

Bitácora lectura, base oculta a vendedor (`canSeeIntercompanyBase`), sync decisión, factura espejo, pago real.

### Garantía — ✅

Atención `DIAGNOSTICO_GARANTIA`, decisión gerente UI, CEO override UI+API, vigencia 6 meses, OS en garantía.

### Cotizaciones — ✅

Precio CEO, pendientes de cotizar, descuentos por rol, sin equipo → OS tras ingreso (flujo existente).

### Compras/O.C. — ✅

Límites configurables, presupuesto mensual, re-autorización O.C., egreso/CxP 1:1.

### Inventario — ✅

Por empresa; SM deshabilitable.

### Facturación/Pagos — ✅

Remisión solicitada vs emitida, idempotencia Facturapi, pagos validados, regularización anticipos.

### Personal — ✅

Vacaciones solo jefe/CEO, prima automática por semana y composición timbrado/efectivo, horas extra semanales, gerente SM excluido.

### Paneles/Reportes — ✅

Por empresa activa; CEO/coordinación según discovery.

### Modo de pruebas e integraciones — ✅

Folios aislados, purge, efectos externos simulados; sin credenciales no simula éxito en prod.

### Rutas, navegación y handoffs — ✅

Atención con tipo/prioridad; cotización sin equipo con preliminares; folios en listados.

### Operación técnica E2E — ✅ + 🧪

Servicio externo en detalle diagnóstico; validar flujo completo en UAT.

### MOT intercompañía E2E — 🧪

Código completo; validar escenario real SM↔SYSTRON en staging.

### Personal y nómina E2E — ✅ + 🧪

Nómina no reabre; fallo fiscal reintento; comisiones mensuales separadas.

### Agenda y panel ventas — ✅

Agenda/metas/panel; sin recordatorios automáticos no definidos.

## §12.3–12.6

Dependencias respetadas en servicios · Plan en [`SYGOS_3.0_PLAN_VALIDACION_FINAL.md`](../../SYGOS_3.0_PLAN_VALIDACION_FINAL.md) · §12.5 metadata repo · §12.6 fuente de verdad = discovery + este checklist.

---

**Integraciones externas:** configuración por empresa (Facturapi, SendGrid, WhatsApp). Comportamiento sin credenciales definido en política fiscal (`external-policy`, staging UAT).

**Sign-off:** Ejecutar R-01…R-22 en staging (Ver como `qa.*`) → marcar progreso en `/configuracion/uat-recorridos` → registrar folios en sección 6 del plan de validación.
