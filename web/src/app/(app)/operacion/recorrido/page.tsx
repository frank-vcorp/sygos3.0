import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

const flows = [
  {
    title: "Servicio SYSTRON (EQUI)",
    steps: [
      { label: "Cliente", href: "/comercial/clientes" },
      { label: "Atención técnica", href: "/operacion/atenciones/nueva" },
      { label: "Ingreso físico (Almacén)", href: "/activos/almacen" },
      { label: "Diagnóstico", href: "/operacion/diagnosticos" },
      { label: "Validación gerente", href: "/operacion/validacion-diagnosticos" },
      { label: "Precio CEO", href: "/comercial/pendientes-cotizar" },
      { label: "Decisión comercial", href: "/comercial/panel" },
      { label: "OS / Reparación", href: "/operacion/os" },
      { label: "Facturación", href: "/administracion/facturacion" },
    ],
  },
  {
    title: "Cotización comercial sin equipo previo",
    steps: [
      { label: "Nueva cotización", href: "/comercial/cotizaciones/nueva" },
      { label: "Precio CEO", href: "/comercial/pendientes-cotizar" },
      { label: "Autorizar + vincular EQUI", href: "/comercial/cotizaciones" },
      { label: "Ingreso Almacén", href: "/activos/almacen" },
      { label: "Técnica / OS automática", href: "/operacion/tecnica" },
    ],
  },
  {
    title: "MOT intercompañía SYSTRON → Servomotores",
    steps: [
      { label: "MOT + Atención (SYSTRON)", href: "/activos/mot" },
      { label: "Ingreso SM", href: "/activos/almacen" },
      { label: "Operación SM", href: "/paneles/gerente-sm" },
      { label: "Cotización base SM", href: "/comercial/cotizaciones" },
      { label: "Precio final SYSTRON", href: "/comercial/pendientes-cotizar" },
      { label: "CxC / CxP intercompañía", href: "/administracion/cxp" },
    ],
  },
  {
    title: "Reparación preautorizada",
    steps: [
      { label: "Atención Reparación", href: "/operacion/atenciones/nueva" },
      { label: "Ingreso + OS inmediata", href: "/activos/almacen" },
      { label: "Ejecución técnica", href: "/operacion/os" },
      { label: "Precio al terminar", href: "/comercial/pendientes-cotizar" },
    ],
  },
];

export default async function RecorridoOperativoPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Recorridos operativos</h1>
        <p className="mt-2 text-sm text-slate-600">
          El menú lateral sigue este orden: comercial → custodia → técnica → abastecimiento. Cada
          cotización y OS indica en detalle qué falta para avanzar.
        </p>
      </div>
      {flows.map((flow) => (
        <section key={flow.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-slate-900">{flow.title}</h2>
          <ol className="mt-4 space-y-2">
            {flow.steps.map((step, i) => (
              <li key={step.href} className="flex items-center gap-3 text-sm">
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
