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
    { href: "/operacion/atenciones/nueva", label: "Nueva atención técnica" },
    { href: "/operacion/diagnosticos", label: "Diagnósticos" },
    { href: "/operacion/os", label: "Órdenes de servicio (OS)" },
    { href: "/operacion/refacciones", label: "Solicitudes de refacción" },
  ];
  if (canValidateDiagnostics(auth.effective.role, slug)) {
    links.splice(2, 0, {
      href: "/operacion/validacion-diagnosticos",
      label: "Validación Gerente Operativo",
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Operación técnica</h1>
      <p className="text-sm text-slate-600">
        Atenciones, diagnósticos, reparación preautorizada, bitácora y SLA (inicio con ingreso físico).
      </p>
      <ul className="divide-y rounded-xl border bg-white">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block px-4 py-3 text-sm font-medium text-sky-800 hover:bg-slate-50">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
