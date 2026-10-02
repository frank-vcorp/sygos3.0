import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DetailSection, RelationLinks } from "@/components/discovery/detail-section";
import { repairStatusLabel } from "@/lib/discovery/labels/work-orders";
import { OsActionsPanel } from "@/components/ops/os-panel";
import { getWorkOrder } from "@/server/assets/work-orders";
import { listBitacora } from "@/server/ops/bitacora";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps } from "@/server/rbac/ops";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { getWorkOrderJourneyHint } from "@/server/journey/work-order-handoffs";
import { getDb } from "@/db/client";
import { quotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatQuoteFolio } from "@/server/masters/folios";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OsDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getWorkOrder(auth.activeCompany.id, id);
  if (!detail) notFound();

  const wo = detail.workOrder;
  const entries = await listBitacora({ workOrderId: id });
  const journeyHint = await getWorkOrderJourneyHint({
    workOrderId: id,
    companyId: auth.activeCompany.id,
    repairStatus: wo.repairStatus,
  });

  const links: { href: string; label: string }[] = [];
  if (wo.diagnosticId) {
    links.push({
      href: `/operacion/diagnosticos/${wo.diagnosticId}`,
      label: "Diagnóstico origen",
    });
  }
  if (wo.equiId) {
    links.push({ href: `/activos/equi/${wo.equiId}`, label: "EQUI" });
  }
  if (wo.motorId) {
    links.push({ href: `/activos/mot/${wo.motorId}`, label: "MOT" });
  }
  const db = getDb();
  const [q] = await db
    .select({ id: quotes.id, folioNumber: quotes.folioNumber })
    .from(quotes)
    .where(eq(quotes.workOrderId, id))
    .limit(1);
  if (q) {
    links.push({
      href: `/comercial/cotizaciones/${q.id}`,
      label: `Cotización ${formatQuoteFolio(q.folioNumber)}`,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/operacion/os" className="text-sm text-sygos-teal hover:underline">
        ← Órdenes de servicio
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{wo.folio}</h1>
        <p className="text-sm text-slate-600">
          {repairStatusLabel[wo.repairStatus ?? ""] ?? wo.repairStatus}
        </p>
        {wo.summary && <p className="mt-1 text-sm text-slate-500">{wo.summary}</p>}
      </div>
      <JourneyPanel title="Qué falta para avanzar" hint={journeyHint} />
      <DetailSection title="Relaciones navegables" description="§4.4">
        <RelationLinks links={links} />
      </DetailSection>
      <OsActionsPanel workOrderId={id} repairStatus={wo.repairStatus} />
      <DetailSection title="Solicitudes de refacción">
        <ul className="divide-y">
          {detail.requests.map((r) => (
            <li key={r.id} className="py-2">
              {r.partNumber} × {r.quantityRequested} — {r.status}
            </li>
          ))}
        </ul>
        <Link href="/operacion/refacciones" className="mt-2 inline-block text-sygos-teal">
          Bandeja refacciones
        </Link>
      </DetailSection>
      <DetailSection title="Bitácora técnica (OS)">
        <ul className="divide-y">
          {entries.map((e) => (
            <li key={e.id} className="py-2">
              {e.body} — {e.authorName}
            </li>
          ))}
        </ul>
      </DetailSection>
    </div>
  );
}
