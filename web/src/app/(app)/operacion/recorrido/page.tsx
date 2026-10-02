import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";
import { roleLabel } from "@/lib/role-labels";

export const dynamic = "force-dynamic";

const flows = [
  {
    title: "Servicio SYSTRON (EQUI)",
    roles: "Ventas → Almacén → Técnico → Gerente SYSTRON → CEO → Ventas → Técnico → Coordinación",
    steps: [
      { label: "Cliente", href: "/comercial/clientes" },
      { label: "Atención técnica", href: "/operacion/atenciones/nueva" },
      { label: "Ingreso físico (Almacén)", href: "/activos/almacen" },
      { label: "Diagnóstico", href: "/operacion/diagnosticos" },
      { label: "Validación gerente", href: "/operacion/validacion-diagnosticos" },
      { label: "Precio CEO", href: "/comercial/pendientes-cotizar" },
      { label: "Decisión comercial", href: "/comercial/panel" },
      { label: "OS / Reparación (automática)", href: "/operacion/os" },
      { label: "Refacciones si aplica", href: "/operacion/refacciones" },
      { label: "Facturación / cobranza", href: "/administracion/facturacion" },
    ],
  },
  {
    title: "Cotización sin equipo previo",
    roles: "Ventas → CEO → Ventas → Almacén → Técnica",
    steps: [
      { label: "Nueva cotización", href: "/comercial/cotizaciones/nueva" },
      { label: "Precio CEO", href: "/comercial/pendientes-cotizar" },
      { label: "Autorizar + vincular EQUI (detalle COT)", href: "/comercial/cotizaciones" },
      { label: "Ingreso Almacén", href: "/activos/almacen" },
      { label: "Diagnóstico/OS (automático)", href: "/operacion/tecnica" },
    ],
  },
  {
    title: "MOT intercompañía",
    roles: "Ventas SYSTRON → Gerente SM → CEO SM → CEO SYSTRON → Ventas SYSTRON → Coordinación",
    steps: [
      { label: "MOT + Atención", href: "/activos/mot" },
      { label: "Ingreso SM", href: "/activos/almacen" },
      { label: "Panel Gerente SM", href: "/paneles/gerente-sm" },
      { label: "Cotización base (botón en MOT SM)", href: "/activos/mot" },
      { label: "Precio final SYSTRON", href: "/comercial/pendientes-cotizar" },
      { label: "CxP / factura intercompañía", href: "/administracion/cxp" },
    ],
  },
  {
    title: "Reparación preautorizada",
    roles: "Ventas/Gerente → Almacén → Técnico → CEO → Ventas",
    steps: [
      { label: "Atención Reparación", href: "/operacion/atenciones/nueva" },
      { label: "Ingreso + OS", href: "/activos/almacen" },
      { label: "Ejecución + refacciones", href: "/operacion/os" },
      { label: "Precio al terminar (auto pendiente cotizar)", href: "/comercial/pendientes-cotizar" },
    ],
  },
  {
    title: "Venta de equipo",
    roles: "Ventas → CEO → Ventas → Almacén/Compras → Coordinación",
    steps: [
      { label: "Cotización venta equipo", href: "/comercial/cotizaciones/nueva" },
      { label: "Autorizar líneas → Venta", href: "/comercial/ventas" },
      { label: "Recepción / entrega", href: "/comercial/panel" },
      { label: "Facturación", href: "/administracion/facturacion" },
    ],
  },
  {
    title: "Compras y O.C.",
    roles: "Gerente → CEO → Coordinación",
    steps: [
      { label: "Compra directa", href: "/operacion/compras" },
      { label: "O.C. nueva", href: "/operacion/oc/nueva" },
      { label: "Panel CEO (autorizar)", href: "/paneles/ceo" },
      { label: "Panel Coordinación (procesar)", href: "/paneles/coordinacion" },
    ],
  },
  {
    title: "Personal y nómina",
    roles: "Jefe → CEO → Coordinación",
    steps: [
      { label: "Vacaciones", href: "/capital-humano/vacaciones" },
      { label: "Mis horas extra", href: "/capital-humano/mis-horas-extra" },
      { label: "Nómina", href: "/capital-humano/nomina" },
      { label: "Kiosco asistencia", href: "/kiosco" },
    ],
  },
];

const qaUsers = [
  { user: "Systronia", role: "Administrador", use: "Ver como + config" },
  { user: "qa.ceo", role: "CEO", use: "Precio, O.C., nómina, vacaciones" },
  { user: "qa.coordinacion", role: "Coordinación", use: "Facturación, pagos, compras" },
  { user: "qa.gerente.systron", role: "Gerente SYSTRON", use: "Validación diagnóstico" },
  { user: "qa.gerente.sm", role: "Gerente SM", use: "MOT intercompañía" },
  { user: "qa.supervisor.systron", role: "Supervisor", use: "Asignación técnica" },
  { user: "qa.tecnico.systron", role: "Técnico", use: "Diagnóstico/OS" },
  { user: "qa.ventas.systron", role: "Ventas", use: "Cliente, cotización, decisión" },
  { user: "qa.almacen.systron", role: "Almacén", use: "Entrada EQUI" },
  { user: "qa.ayudante.sm", role: "Ayudante SM", use: "Kiosco / RH" },
  { user: "qa.kiosco", role: "Kiosco", use: "Marcaje" },
];

export default async function RecorridoOperativoPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Recorridos operativos</h1>
        <p className="mt-2 text-sm text-slate-600">
          Validación UAT: entra como <strong>Systronia</strong>, usa <strong>Ver como</strong> con
          los usuarios QA, y en cada pantalla sigue el bloque amarillo{" "}
          <em>Siguiente en el recorrido</em>. Rol activo:{" "}
          {roleLabel(auth.effective.role)} · {auth.activeCompany.name}
        </p>
        <p className="mt-2 text-sm">
          <Link href="/configuracion/cierre-e2e" className="text-sygos-teal underline">
            Checklist E2E
          </Link>
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium">Usuarios QA por rol</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-1">Usuario</th>
              <th className="py-1">Rol</th>
              <th className="py-1">Probar</th>
            </tr>
          </thead>
          <tbody>
            {qaUsers.map((r) => (
              <tr key={r.user} className="border-t border-slate-100">
                <td className="py-2 font-mono text-xs">{r.user}</td>
                <td className="py-2">{r.role}</td>
                <td className="py-2 text-slate-600">{r.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {flows.map((flow) => (
        <section key={flow.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-slate-900">{flow.title}</h2>
          <p className="mt-1 text-xs text-slate-500">{flow.roles}</p>
          <ol className="mt-4 space-y-2">
            {flow.steps.map((step, i) => (
              <li key={`${flow.title}-${step.label}`} className="flex items-center gap-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {i + 1}
                </span>
                <Link href={step.href} className="text-sygos-teal hover:underline">
                  {step.label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
