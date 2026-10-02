import { redirect } from "next/navigation";
import { formatMxn } from "@/server/commercial/money";
import { listCommissions, syncCommissionsForAuthorizedQuotes } from "@/server/hr/commissions";
import { getAuthContext } from "@/server/auth/session";
import { canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function ComisionesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  await syncCommissionsForAuthorizedQuotes(auth.activeCompany.id);
  const rows = await listCommissions(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Comisiones</h1>
      <table className="min-w-full rounded-xl border bg-white text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Periodo</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="px-4 py-3">{r.periodKey}</td>
              <td className="px-4 py-3">{r.status}</td>
              <td className="px-4 py-3 text-right">{formatMxn(r.amountMxn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
