import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";
import { canSeeBillingModule } from "@/server/rbac/billing";
import { canSeeFinanceModule } from "@/server/rbac/finance";

export const dynamic = "force-dynamic";

/** Hub administración §7–§8 (facturación, pagos, cobranza, finanzas, CxP). */
export default async function AdministracionHubPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const billing = canSeeBillingModule(auth.effective.role);
  const finance = canSeeFinanceModule(auth.effective.role);
  if (!billing && !finance) redirect("/inicio");

  const links = [
    ...(billing ?
      [
        {
          href: "/administracion/facturacion",
          label: "Facturación",
          desc: "Facturas, remisiones, pendientes coordinación (§7.1).",
        },
        {
          href: "/administracion/pagos",
          label: "Pagos",
          desc: "Registro comercial · validación Coordinación (§7.2).",
        },
        {
          href: "/administracion/cobranza",
          label: "Cobranza / CxC",
          desc: "Saldos abiertos por cliente (§7.3).",
        },
      ]
    : []),
    ...(finance ?
      [
        {
          href: "/administracion/finanzas",
          label: "Finanzas",
          desc: "Dashboard, movimientos, cuentas (§8.1).",
        },
        {
          href: "/administracion/cxp",
          label: "Cuentas por pagar",
          desc: "CxP y pagos a proveedores (§8.2).",
        },
        {
          href: "/administracion/finanzas/pendientes-comprobacion",
          label: "Pendientes de comprobación",
          desc: "Validación Coordinación antes de cerrar egresos.",
        },
      ]
    : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Facturación y finanzas</h1>
      <p className="text-sm text-slate-600">
        Módulos administrativos por empresa activa — bandejas dentro de cada listado.
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
