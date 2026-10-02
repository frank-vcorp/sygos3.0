import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionLogForm } from "@/components/billing/collection-log-form";
import { listCollectionLogs } from "@/server/billing/collections";
import { listReceivables } from "@/server/billing/ar-ap";
import { formatMxn } from "@/server/commercial/money";
import { getAuthContext } from "@/server/auth/session";
import { canSeeBillingModule } from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CobranzaDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeBillingModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const rows = await listReceivables(auth.activeCompany.id);
  const entry = rows.find((r) => r.arId === id);
  if (!entry) redirect("/administracion/cobranza");

  const logs = await listCollectionLogs(id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/administracion/cobranza" className="text-sm text-sygos-teal">
        ← Cobranza
      </Link>
      <h1 className="text-xl font-semibold">{entry.clientName}</h1>
      <p className="text-sm">
        Saldo: {formatMxn(entry.balanceMxn)} · Original: {formatMxn(entry.originalMxn)}
      </p>
      <CollectionLogForm arEntryId={id} />
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {logs.map((log) => (
          <li key={log.id} className="px-4 py-3">
            <p>{log.note}</p>
            <p className="text-xs text-slate-500">
              {log.createdAt.toLocaleString("es-MX")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
