import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Ventas de equipo</h1>
      <table className="min-w-full rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Folio</th>
            <th className="px-4 py-3 text-left">Cliente</th>
            <th className="px-4 py-3 text-left">Cotización</th>
            <th className="px-4 py-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} className="border-b border-slate-100">
              <td className="px-4 py-3">
                <Link href={`/comercial/ventas/${s.id}`} className="text-sygos-teal hover:underline">
                  {s.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{s.clientName}</td>
              <td className="px-4 py-3">{s.quoteFolio}</td>
              <td className="px-4 py-3">{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
