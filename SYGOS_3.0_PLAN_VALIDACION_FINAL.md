# SYGOS 3.0 — Plan de validación operativa

Fuente funcional: [SYGOS_3.0_DISCOVERY_FUNCIONAL_VALIDADO.md](./SYGOS_3.0_DISCOVERY_FUNCIONAL_VALIDADO.md)

Implementación: `web/` · UAT: [web/docs/UAT.md](./web/docs/UAT.md) · Usuarios «Ver como»: usuarios `qa.*` + **Systronia** (Administrador).

---

## 1. Para qué sirve este plan (y qué no es)

| Enfoque | Objetivo |
|---------|----------|
| **Este documento** | Comprobar que **los recorridos operativos** del discovery funcionan de punta a punta: entidades enlazadas, **rol correcto** en cada paso, **handoffs** a la bandeja del siguiente responsable, restricciones multiempresa. |
| **Fases 1–9 (§12.4 discovery)** | Mapa de **construcción** por bloques de producto. Útil para desarrollo; **no sustituye** validar flujos cruzados. Ver [Anexo A](#anexo-a-fases-de-construcción-124). |
| **§12.1 completitud de módulo** | Checklist por entidad (formulario, listado, detalle). Se usa **cuando un recorrido falla** para acotar si el bug es de un módulo aislado o de la integración. Ver [web/docs/DISCOVERY-12-CHECKLIST.md](./web/docs/DISCOVERY-12-CHECKLIST.md). |

**Regla de validación:** un recorrido **pasa** solo si, en orden, cada paso es ejecutable por el rol indicado, el estado cambia como en discovery, las **relaciones son navegables** en detalle (Cliente ↔ EQUI/MOT ↔ Atención ↔ Diagnóstico/OS ↔ Cotización ↔ documentos/finanzas según aplique) y el registro **sale** de la bandeja anterior al resolver el handoff.

---

## 2. Plantilla de ejecución (por recorrido)

Copiar una fila por paso al ejecutar UAT:

| # | Paso (discovery) | Rol | Empresa activa | Acción / pantalla | Handoff esperado | Relaciones a abrir en detalle | ✓ / ✗ | Notas |
|---|------------------|-----|----------------|-------------------|------------------|-------------------------------|-------|-------|
| 1 | … | `qa.…` o Systronia | SYSTRON / SM | … | Aparece en panel/bandeja de … | … | | |

**Convenciones**

- Probar con **«Ver como»** desde Systronia salvo pasos que exijan CEO sin admin (usar `qa.ceo`).
- Cambiar **empresa activa** cuando el rol tenga acceso a ambas (CEO, Coordinación, Admin).
- Anotar folios creados en la fila 1 del recorrido para trazabilidad.
- Si un paso muestra una acción **incompatible con el estado**, es fallo (discovery: detalle debe decir qué falta).

---

## 3. Catálogo de recorridos (índice)

Cada ítem apunta al discovery; la sección [4](#4-recorridos-detallados-para-uat) trae el guion UAT de los críticos.

| ID | Recorrido | Discovery (ancla) | Roles principales |
|----|-----------|-------------------|-------------------|
| **R-01** | Identidad + atención técnica (entrada operación) | §4.1–4.2, ruta obligatoria Atención | Ventas, Almacén, Supervisor, Técnico |
| **R-02** | Diagnóstico SYSTRON (EQUI) | §4.3 recorrido completo | Técnico, Gerente Op. SYSTRON, CEO |
| **R-03** | Cotización comercial (cadena con diagnóstico) | §5 recorridos consolidados | Gerente Op., CEO, Ventas |
| **R-04** | Cotización iniciada por vendedor (con/sin equipo) | §5 «Cotización de servicio/equipo…», «sin equipo físico» | Ventas, CEO |
| **R-05** | Reparación preautorizada + precio después | §5 «Reparación preautorizada…», §4.4 | Técnico, Gerente Op., CEO, Ventas |
| **R-06** | MOT intercompañía (maestro) | §4.1 recorrido maestro MOT intercompañía | Ventas SYSTRON, Gerente SM, CEO, Coordinación |
| **R-07** | Cliente directo Servomotores (GO híbrido) | §1.4 Gerente Op. SM, §4.x SM | `qa.gerente.sm`, CEO |
| **R-08** | Garantía | §4.5 flujo SYSTRON / MOT SM | Gerente Op., CEO |
| **R-09** | Servicio externo / maquila en diagnóstico | §4.3 diagnóstico externo | Gerente Op. SYSTRON, Coordinación |
| **R-10** | Refacciones en OS | §4.4 recorrido solicitud refacción | Técnico, Almacén, Gerente Op. |
| **R-11** | Movimientos físicos (ingreso, salida prueba, egreso) | §4.6 | Almacén, Ventas/Gerente SM |
| **R-12** | Compras directas y O.C. | §6 compras | Gerente Op., CEO, Coordinación |
| **R-13** | Factura, remisión, pago, cobranza | §7 recorridos | Ventas (solicita), Coordinación (emite/valida) |
| **R-14** | Intercompañía fiscal (CxC SM / CxP SYSTRON) | §7 intercompañía, §12.2 MOT intercompañía E2E | Coordinación, CEO |
| **R-15** | Vacaciones | §9 recorrido vacaciones | Jefe (CEO/gerente), CEO |
| **R-16** | Asistencia / kiosco | §9 recorrido kiosco | Kiosco, Coordinación/RH |
| **R-17** | Nómina semanal | §9 recorrido nómina | Coordinación, CEO |
| **R-18** | Horas extra | §9 recorrido horas extra | Técnico, jefe, CEO |
| **R-19** | Venta de equipo (autorización parcial) | §5 venta de equipo | Ventas, CEO |
| **R-20** | Servicio en campo | §5 servicio en campo | Ventas, CEO |
| **R-21** | Comisiones (mensual, separado nómina) | §9 comisiones | Coordinación, CEO |
| **R-22** | Producción técnica (SYSTRON) | §8 producción | Técnico, paneles |

Prioridad UAT sugerida: **R-01 → R-02 → R-03 → R-06 → R-13 → R-14** (núcleo operación + dinero); luego R-05, R-08–R-12, R-15–R-18.

---

## 4. Recorridos detallados para UAT

### R-01 — Cliente → identidad física → Atención (SYSTRON EQUI)

**Objetivo:** Validar que no se salta tipo de atención/prioridad y que identidad física ≠ episodio de servicio.

| # | Paso | Rol | Acción | Handoff / resultado |
|---|------|-----|--------|---------------------|
| 1 | Alta Cliente | Ventas (`qa.ventas.systron`) | Crear cliente SYSTRON | Cliente en listado, detalle navegable |
| 2 | Alta EQUI | Ventas | Crear EQUI ligado al cliente | Folio `EQUI-…`; falla en Atención, no en equipo |
| 3 | Atención Diagnóstico | Ventas | Cliente → EQUI → tipo **Diagnóstico** → prioridad → contexto | Atención creada; SLA **no** iniciado aún |
| 4 | Ingreso físico | Almacén (`qa.almacen.systron`) | Confirmar entrada/ingreso | SLA inicia; aparece en cola técnica |
| 5 | Trazabilidad | Ventas o Admin | Desde EQUI y Cliente abrir Atención, y viceversa | Enlaces bidireccionales en detalle |

**Falla típica:** crear MOT en SYSTRON esperando diagnóstico local (discovery: MOT SYSTRON va a Servomotores → usar **R-06**).

---

### R-02 + R-03 — Diagnóstico → validación → cotización → decisión (SYSTRON EQUI)

**Discovery:** §4.3 recorrido interno + §5 «Cotización desde Diagnóstico» + handoffs «Pendiente de cotizar».

| # | Paso | Rol | Acción | Handoff / resultado |
|---|------|-----|--------|---------------------|
| 1 | Asignación | Supervisor (`qa.supervisor.systron`) | Asignar diagnóstico | Técnico ve trabajo en panel |
| 2 | Ejecución | Técnico (`qa.tecnico.systron`) | Bitácora, terminar con resultado | Estado «Diagnóstico terminado» |
| 3 | Validación | Gerente Op. SYSTRON (`qa.gerente.systron`) | Validar **o** devolver con motivo | Validado → **Pendientes de cotizar** (CEO) |
| 4 | (Opcional) Devolución | Gerente Op. | Devolver a corrección | Técnico ve motivo; nueva terminación obligatoria |
| 5 | Precio | CEO (`qa.ceo`) | Asignar precio en pendiente de cotizar | Cotización «Pendiente de decisión» |
| 6 | Comercial | Ventas | Seguimiento, descuento dentro de límite, autorizada/no | Si autorizada: acciones posteriores válidas (OS, factura/remisión según tipo) |
| 7 | Integridad datos | CEO o Admin | Detalle cotización: Cliente, EQUI, **Diagnóstico origen** heredados | No re-captura duplicada |

**Criterios §12.2:** validación gerente antes de cotizar; devolución conserva historia; vendedor no fija precio.

---

### R-04 — Cotización iniciada por vendedor (sin diagnóstico previo)

**Discovery:** §5 «Cotización de servicio/equipo iniciada por Vendedor».

| # | Paso | Rol | Acción | Handoff |
|---|------|-----|--------|---------|
| 1 | Cotización sin EQUI físico | Ventas | Tipo servicio/equipo, datos preliminares (marca/modelo/serial si hay) | **No** crear EQUI permanente solo por cotizar |
| 2 | Precio | CEO | Pendientes de cotizar | Pendiente de decisión |
| 3 | Autorizada sin ingreso | Ventas + CEO | Autorizar tipo que exige equipo | Estado «pendiente ingreso»; **no** OS hasta ingreso físico |
| 4 | Ingreso + OS | Almacén + flujo técnico | Ingreso físico luego OS | Cierra hueco discovery cotización sin equipo |

---

### R-06 — MOT intercompañía (recorrido maestro)

**Discovery:** §4.1 «Recorrido maestro MOT intercompañía» (cadena completa).

Validar **en paralelo** restricciones de visibilidad:

| Rol | Debe ver | No debe ver |
|-----|----------|-------------|
| Ventas SYSTRON | Estado/bitácora SM (lectura), decisión comercial propia | Cotización base / costo SM |
| Gerente SM | Operación SM, cliente admin = SYSTRON | Precio final / margen SYSTRON |
| SYSTRON (técnico/gerente SYSTRON) | Seguimiento lectura | Editar bitácora/estado SM |

**Pasos (resumido):**

1. Ventas SYSTRON: MOT + Atención (no almacén SYSTRON).
2. Gerente SM: pendiente **ingreso físico** → confirmar → SLA.
3. Gerente SM: diagnóstico/reparación, bitácora, base/cotización SM cuando corresponda.
4. CEO SYSTRON: pendiente cotizar precio **final**.
5. Ventas SYSTRON: decisión cliente → **propaga** a SM.
6. Coordinación: factura intercompañía → CxC SM + CxP SYSTRON; pago real entre cuentas (UAT: `SYGOS_INTERNAL_FISCAL=1`).

Marcar en checklist: [DISCOVERY-12-CHECKLIST.md](./web/docs/DISCOVERY-12-CHECKLIST.md) § MOT intercompañía 🧪.

---

### R-13 — Solicitud comercial → documento → cobranza

**Discovery:** §7 (Vendedor solicita; Coordinación emite/valida).

| # | Paso | Rol | Acción |
|---|------|-----|--------|
| 1 | Solicitud | Ventas | Solicitar factura o remisión desde operación autorizada |
| 2 | Emisión | Coordinación (`qa.coordinacion`) | Generar factura/remisión; navegar a operación origen |
| 3 | Pago | Ventas | Registrar pago (si aplica rol) |
| 4 | Validación ingreso | Coordinación | Validar pago → reduce saldo CxC |
| 5 | Trazabilidad | Coordinación | Desde factura: cliente, cotización/OS/MOT según origen |

---

### R-12 — Compra directa vs O.C.

**Discovery:** §6 límites, presupuesto, CEO autoriza O.C., 1:1 egreso/CxP.

| # | Paso | Rol | Acción |
|---|------|-----|--------|
| 1 | Compra directa dentro de límite | Gerente Op. (SYSTRON o SM) | Registrar compra |
| 2 | Rebasa límite | Gerente Op. | Debe derivar a O.C. pendiente CEO |
| 3 | Autorización O.C. | CEO | Autorizar |
| 4 | Procesamiento | Coordinación | Procesar → exactamente un egreso **o** una CxP |

---

### R-15 / R-16 / R-17 / R-18 — Personal (cadena RH)

Ejecutar como recorridos **independientes** pero comprobar dependencias con nómina:

- **R-15 Vacaciones:** jefe registra → pendiente CEO → autorizada → impacto asistencia/prima (§9).
- **R-16 Kiosco:** `qa.kiosco` marcaje; no panel operativo normal.
- **R-17 Nómina:** preliminar → autorización CEO → no reabrir; timbrado UAT interno.
- **R-18 Horas extra:** colaborador **Mis horas extra** → jefe → CEO; gerente SM **excluido**.

---

## 5. Matriz recorrido ↔ criterios §12.2

Use esta tabla para no repetir criterios sueltos: el recorrido es la prueba; §12.2 es la lista de aserciones.

| Criterio §12.2 (grupo) | Recorridos donde se prueba |
|------------------------|----------------------------|
| Multiempresa / contexto activo | Todos; especialmente R-06, R-14 |
| EQUI/MOT y custodia | R-01, R-06, R-11 |
| Diagnóstico y reparación | R-02, R-05, R-09, R-10 |
| MOT intercompañía E2E | R-06, R-14 |
| Cotizaciones | R-03, R-04, R-19, R-20 |
| Compras/O.C. | R-12 |
| Facturación/pagos | R-13, R-14 |
| Personal/nómina | R-15–R-18 |
| Paneles y handoffs | R-02 (bandejas gerente/CEO), R-03 paso 3–5 |

---

## 6. Registro de ejecución

| Recorrido | Fecha | Entorno | Ejecutor | Resultado | Incidencias / folios |
|-----------|-------|---------|----------|-----------|----------------------|
| R-01 | | staging | | | |
| R-02+03 | | | | | |
| R-06 | | | | | |
| … | | | | | |

Opcional en producto: marcar ítems en `/configuracion/cierre-e2e` alineados a estos recorridos (evolución deseable del checklist actual orientado a módulos).

---

## Anexo A — Fases de construcción (§12.4)

El discovery exige que las **fases de construcción** sigan documentadas con el mismo alcance. No confundir con validación por recorrido.

| Fase | Alcance (resumen) |
|------|-------------------|
| 1 | Multiempresa, usuarios, maestros, configuración |
| 2 | EQUI, MOT, inventario, custodia |
| 3 | Diagnóstico, OS, garantía, servicio externo, MOT intercompañía |
| 4 | Cotizaciones, ventas, paneles comerciales |
| 5 | Facturación, remisiones, pagos, CxC, intercompañía fiscal |
| 6 | Compras, O.C., finanzas, CxP |
| 7 | Personal, asistencia, nómina, comisiones |
| 8 | Producción, paneles, reportes |
| 9 | Integraciones, modo de pruebas, cierre transversal |

Estado de implementación: entregado en `web/`; la **aceptación funcional** de negocio se declara al cerrar los recorridos de la sección 3 con la plantilla de la sección 2.
