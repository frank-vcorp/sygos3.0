import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";
import { canSeeHrModule, canSeeOwnOvertime } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function CapitalHumanoHubPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role) && !canSeeOwnOvertime(auth.effective.role)) {
    redirect("/inicio");
  }

  const links = [
    ...(canSeeHrModule(auth.effective.role)
      ? [
          {
            href: "/capital-humano/colaboradores",
            label: "Colaboradores",
            desc: "§9.1 — alta, jefe, salarios, relaciones RH.",
          },
          {
            href: "/capital-humano/vacaciones",
            label: "Vacaciones",
            desc: "Jefe registra · CEO autoriza · prima 25% en nómina.",
          },
          {
            href: "/capital-humano/nomina",
            label: "Nómina",
            desc: "§9.2 — borrador, autorización CEO, timbrado.",
          },
          {
            href: "/capital-humano/comisiones",
            label: "Comisiones",
            desc: "Devengo mensual separado de nómina.",
          },
        ]
      : []),
    ...(canSeeOwnOvertime(auth.effective.role)
      ? [
          {
            href: "/capital-humano/mis-horas-extra",
            label: "Mis horas extra",
            desc: "Colaborador → jefe → CEO (Gerente SM excluido).",
          },
        ]
      : []),
    { href: "/kiosco", label: "Kiosco asistencia", desc: "§9 — marcaje (fuera del menú operativo)." },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Personal y nómina</h1>
      <p className="text-sm text-slate-600">Fase 7 discovery — módulos por empresa activa.</p>
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
