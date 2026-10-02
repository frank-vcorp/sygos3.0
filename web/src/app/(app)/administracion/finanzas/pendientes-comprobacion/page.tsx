import Link from "next/link";
import { redirect } from "next/navigation";
import { RegularizeMovementForm } from "@/components/finance/regularize-form";
import { formatMxn } from "@/server/commercial/money";
import { listPendingVerification } from "@/server/finance/movements";
import { formatMovementFolio } from "@/server/masters/folios";
import { getAuthContext } from "@/server/auth/session";
import { canSeeFinanceModule } from "@/server/rbac/finance";

export const dynamic = "force-dynamic";

export default async function PendientesComprobacionPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeFinanceModule(auth.effective.role)) redirect("/inicio");

  const rows = await listPendingVerification(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <Link href="/administracion/finanzas" className="text-sm text-sygos-teal">
        ← Finanzas
      </Link>
      <h1 className="text-2xl font-semibold">Pendientes de comprobación</h1>
      <ul className="divide-y rounded-xl border bg-white text-sm shadow-sm">
        {rows.map((m) => (
          <li key={m.id} className="px-4 py-3">
            <p className="font-medium">
              {formatMovementFolio(m.folioNumber)} · {m.description}
            </p>
            <p className="text-slate-500">{formatMxn(m.amountMxn)}</p>
            <RegularizeMovementForm movementId={m.id} />
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-slate-500">Sin pendientes.</li>
        )}
      </ul>
    </div>
  );
}
