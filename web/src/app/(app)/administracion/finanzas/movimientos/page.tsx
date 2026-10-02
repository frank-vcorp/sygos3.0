import Link from "next/link";
import { redirect } from "next/navigation";
import { ManualMovementForm } from "@/components/finance/finance-forms";
import { formatMxn } from "@/server/commercial/money";
import { ensureDefaultFinancialAccounts } from "@/server/finance/accounts";
import { listFinancialMovements } from "@/server/finance/movements";
import { formatMovementFolio } from "@/server/masters/folios";
import { getAuthContext } from "@/server/auth/session";
import { canSeeFinanceModule } from "@/server/rbac/finance";

export const dynamic = "force-dynamic";

export default async function MovimientosPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeFinanceModule(auth.effective.role)) redirect("/inicio");

  const accounts = await ensureDefaultFinancialAccounts(auth.activeCompany.id);
  const movements = await listFinancialMovements(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <Link href="/administracion/finanzas" className="text-sm text-sygos-teal">
        ← Finanzas
      </Link>
      <h1 className="text-2xl font-semibold">Movimientos</h1>
      <ManualMovementForm accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />
      <table className="min-w-full rounded-xl border bg-white text-sm shadow-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Folio</th>
            <th className="px-4 py-3 text-left">Tipo</th>
            <th className="px-4 py-3 text-left">Descripción</th>
            <th className="px-4 py-3 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-b border-slate-100">
              <td className="px-4 py-3">{formatMovementFolio(m.folioNumber)}</td>
              <td className="px-4 py-3">{m.kind}</td>
              <td className="px-4 py-3">{m.description}</td>
              <td className="px-4 py-3 text-right">{formatMxn(m.amountMxn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
