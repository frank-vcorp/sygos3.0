import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionLogForm } from "@/components/billing/collection-log-form";
import { DetailSection, RelationLinks } from "@/components/discovery/detail-section";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { listCollectionLogs } from "@/server/billing/collections";
import { listReceivables } from "@/server/billing/ar-ap";
import { formatMxn } from "@/server/commercial/money";
import { formatFiscalFolio } from "@/server/masters/folios";
import { getAuthContext } from "@/server/auth/session";
import { canSeeBillingModule } from "@/server/rbac/billing";
import { getReceivableJourneyHint } from "@/server/journey/fiscal-handoffs";

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
  const journeyHint = getReceivableJourneyHint({
    balanceMxn: entry.balanceMxn,
    isOverdue: entry.isOverdue,
    fiscalDocumentId: entry.fiscalDocumentId,
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/administracion/cobranza" className="text-sm text-sygos-teal">
        ← Cobranza
      </Link>
      <h1 className="text-xl font-semibold">{entry.clientName}</h1>
      <p className="text-sm">
        Saldo: {formatMxn(entry.balanceMxn)} · Original: {formatMxn(entry.originalMxn)}
      </p>
      <JourneyPanel title="Qué falta para avanzar" hint={journeyHint} />
      <DetailSection title="Relaciones">
        <RelationLinks
          links={[
            {
              href: `/administracion/facturacion/${entry.fiscalDocumentId}`,
              label: `${formatFiscalFolio(entry.docKind, entry.fiscalFolio)} · documento origen`,
            },
            { href: `/comercial/clientes/${entry.clientId}`, label: "Cliente" },
            { href: "/administracion/pagos", label: "Registrar / validar pagos" },
          ]}
        />
      </DetailSection>
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
