import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";
import { canManageSuppliers } from "@/server/rbac/masters";
import { canSeePurchasesModule } from "@/server/rbac/purchases";
import { canSeeProduction } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function AbastecimientoPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeePurchasesModule(auth.effective.role)) redirect("/inicio");

  const links = [
    {
      href: "/operacion/compras",
      label: "Compras directas",
      desc: "Límites gerente · validación Coordinación · Egreso o CxP",
    },
    {
      href: "/operacion/oc",
      label: "Órdenes de compra",
      desc: "Autorización CEO · procesamiento Coordinación",
    },
    {
      href: "/operacion/proveedores",
      label: "Proveedores",
      desc: "Catálogo por empresa",
    },
  ];

  if (canSeeProduction(auth.effective.role)) {
    links.push({
      href: "/operacion/inventario",
      label: "Inventario refacciones",
      desc: "Existencias SYSTRON · mínimos informativos",
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Compras y proveedores</h1>
      <p className="text-sm text-slate-600">
        Módulo de abastecimiento (discovery §6): compras, O.C., proveedores e inventario cuando
        aplique.
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
      {canManageSuppliers(auth.effective.role) && (
        <p className="text-xs text-slate-500">
          Alta de proveedores desde el listado de Proveedores o en flujos de compra/O.C.
        </p>
      )}
    </div>
  );
}
