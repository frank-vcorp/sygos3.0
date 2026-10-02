import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { equipmentSaleStatusLabel } from "@/lib/discovery/labels/sales";
import { listEquipmentSales } from "@/server/commercial/sales";
import { getAuthContext } from "@/server/auth/session";
import { canSeeCommercialModule } from "@/server/rbac/commercial";

export const dynamic = "force-dynamic";

export default async function VentasEquipoPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCommercialModule(auth.effective.role)) redirect("/inicio");

  const sales = await listEquipmentSales(auth.activeCompany.id);

  return (
    <ListShell
      title="Ventas de equipo"
      description="Módulo §3.4 — ventas desde cotización autorizada; autorización parcial por líneas."
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Folio</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Cotización origen</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/comercial/ventas/${s.id}`}
                  className="font-medium text-sygos-teal hover:underline"
                >
                  {s.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{s.clientName}</td>
              <td className="px-4 py-3">
                {s.quoteId ?
                  <Link
                    href={`/comercial/cotizaciones/${s.quoteId}`}
                    className="text-sygos-teal hover:underline"
                  >
                    {s.quoteFolio}
                  </Link>
                : s.quoteFolio}
              </td>
              <td className="px-4 py-3">
                {equipmentSaleStatusLabel[s.status] ?? s.status.replace(/_/g, " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
