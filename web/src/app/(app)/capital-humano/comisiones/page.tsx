import { redirect } from "next/navigation";
import { CommissionsPayButton } from "@/components/hr/commissions-pay";
import { ListShell } from "@/components/masters/list-shell";
import { commissionStatusLabel } from "@/lib/discovery/labels/hr";
import { formatMxn } from "@/server/commercial/money";
import { listCommissions, syncCommissionsForAuthorizedQuotes } from "@/server/hr/commissions";
import { getAuthContext } from "@/server/auth/session";
import { canPayCommissions, canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function ComisionesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  await syncCommissionsForAuthorizedQuotes(auth.activeCompany.id);
  const rows = await listCommissions(auth.activeCompany.id);
  const periods = [...new Set(rows.map((r) => r.periodKey))].sort().reverse();

  return (
    <div className="space-y-4">
      {canPayCommissions(auth.effective.role) && periods.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 shadow-sm">
          {periods.slice(0, 3).map((p) => (
            <CommissionsPayButton key={p} periodKey={p} />
          ))}
        </div>
      )}
      <ListShell
        title="Comisiones"
        description="§9 — devengo mensual separado de nómina; pago autorizado por CEO/Coordinación."
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Periodo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.periodKey}</td>
                <td className="px-4 py-3">
                  {commissionStatusLabel[r.status] ?? r.status}
                </td>
                <td className="px-4 py-3 text-right">{formatMxn(r.amountMxn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
    </div>
  );
}
