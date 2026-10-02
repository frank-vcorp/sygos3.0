import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps, canValidateDiagnostics } from "@/server/rbac/ops";
import type { CompanySlug } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function OperacionTecnicaPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const slug = auth.activeCompany.slug as CompanySlug;
  const links = [
    {
      href: "/operacion/atenciones/nueva",
      label: "Nueva atención técnica",
      desc: "Cliente → EQUI/MOT → tipo → prioridad → contexto (§4.2). SLA con ingreso físico.",
    },
    {
      href: "/operacion/diagnosticos",
      label: "Diagnósticos",
      desc: "Listado, detalle, bitácora y validación Gerente Operativo.",
    },
    ...(canValidateDiagnostics(auth.effective.role, slug)
      ? [
          {
            href: "/operacion/diagnosticos?vista=validacion",
            label: "Pendientes de validación",
            desc: "Bandeja del módulo Diagnósticos — no es un módulo aparte.",
          },
        ]
      : []),
    {
      href: "/operacion/os",
      label: "Órdenes de servicio (OS)",
      desc: "Reparación preautorizada, refacciones y cierre técnico (§4.4).",
    },
    {
      href: "/operacion/refacciones",
      label: "Solicitudes de refacción",
      desc: "Desde OS hacia almacén / compras.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Operación técnica</h1>
      <p className="text-sm text-slate-600">
        Hub del discovery §4: atenciones, diagnósticos, OS y bandejas internas. Cada módulo concentra
        sus vistas; aquí solo accesos operativos.
      </p>
      <ul className="divide-y rounded-xl border bg-white shadow-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block px-4 py-4 hover:bg-slate-50">
              <p className="text-sm font-medium text-sygos-teal">{l.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{l.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
