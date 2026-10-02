import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FunctionalHistoryPanel } from "@/components/history/functional-history-panel";
import { ExternalServicePanel } from "@/components/ops/external-service-panel";
import { DiagnosticActionsPanel } from "@/components/ops/ops-forms";
import {
  WarrantyCeoCommercialButton,
  WarrantyGerenteActions,
} from "@/components/ops/warranty-actions";
import type { CompanySlug } from "@/lib/company";
import { resolveCompanyIds } from "@/server/assets/context";
import { listBitacora } from "@/server/ops/bitacora";
import { getDiagnosticDetail } from "@/server/ops/diagnostics";
import { listSuppliers } from "@/server/masters/suppliers";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps } from "@/server/rbac/ops";
import { isSuperAdmin } from "@/server/rbac/roles";
import { DetailSection, RelationLinks } from "@/components/discovery/detail-section";
import { JourneyPanel } from "@/components/journey/journey-panel";
import {
  attentionTypeLabel,
  diagnosticStatusLabel,
} from "@/lib/discovery/labels/diagnostics";
import { getDiagnosticJourneyHint } from "@/server/journey/diagnostic-handoffs";
import { getDb } from "@/db/client";
import { quotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatQuoteFolio } from "@/server/masters/folios";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DiagnosticoDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getDiagnosticDetail(id);
  if (!detail) notFound();

  const ids = await resolveCompanyIds();
  const slug = auth.activeCompany.slug as CompanySlug;
  const readOnly =
    slug === "SYSTRON" &&
    detail.diagnostic.companyId === ids.servomotoresId;

  const entries = await listBitacora({ diagnosticId: id });
  const suppliers = await listSuppliers({
    companyId: detail.diagnostic.companyId,
  });
  const actorCanCeo =
    auth.effective.role === "CEO" ||
    auth.effective.role === "ADMINISTRADOR" ||
    isSuperAdmin(auth.effective.role);

  const db = getDb();
  const [linkedQuote] = await db
    .select({ id: quotes.id, folioNumber: quotes.folioNumber })
    .from(quotes)
    .where(eq(quotes.diagnosticId, id))
    .limit(1);

  const relationLinks: { href: string; label: string }[] = [];
  if (detail.attention?.clientId) {
    relationLinks.push({
      href: `/comercial/clientes/${detail.attention.clientId}`,
      label: "Cliente",
    });
  }
  if (detail.attention?.equiId) {
    relationLinks.push({
      href: `/activos/equi/${detail.attention.equiId}`,
      label: detail.assetLabel.startsWith("EQUI") ? detail.assetLabel : "EQUI",
    });
  }
  if (detail.attention?.motorId) {
    relationLinks.push({
      href: `/activos/mot/${detail.attention.motorId}`,
      label: detail.assetLabel.startsWith("MOT") ? detail.assetLabel : "MOT",
    });
  }
  if (linkedQuote) {
    relationLinks.push({
      href: `/comercial/cotizaciones/${linkedQuote.id}`,
      label: `Cotización ${formatQuoteFolio(linkedQuote.folioNumber)}`,
    });
  }

  const journeyHint = await getDiagnosticJourneyHint({
    diagnosticId: id,
    companyId: detail.diagnostic.companyId,
    status: detail.diagnostic.status,
    assignedUserId: detail.diagnostic.assignedUserId,
    attentionType: detail.attention?.attentionType,
    warrantyDecision: detail.diagnostic.warrantyDecision,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/operacion/diagnosticos" className="text-sm text-sky-800 hover:underline">
        ← Diagnósticos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{detail.folio}</h1>
        <p className="text-sm text-slate-600">
          {detail.clientName} · {detail.assetLabel} · {detail.attention?.attentionType}
        </p>
        <p className="text-sm text-slate-500">
          {diagnosticStatusLabel[detail.diagnostic.status] ?? detail.diagnostic.status}
        </p>
        <p className="text-sm text-slate-600">{detail.attention?.reportedFailure}</p>
        {detail.attention?.warrantySourceWorkOrderId && (
          <p className="text-sm text-slate-600">
            Reparación origen:{" "}
            <Link
              href={`/operacion/os/${detail.attention.warrantySourceWorkOrderId}`}
              className="text-sygos-teal underline"
            >
              ver OS original
            </Link>
          </p>
        )}
        {detail.diagnostic.warrantyDecision && (
          <p className="text-sm text-amber-900">
            Decisión técnica: {detail.diagnostic.warrantyDecision}
            {detail.diagnostic.warrantyCommercialOverride
              ? " · Override comercial CEO"
              : ""}
          </p>
        )}
      </div>
      <JourneyPanel title="Qué falta para avanzar" hint={journeyHint} />
      <DetailSection title="Contexto" description="Datos heredados de la Atención (§4.3).">
        <p>
          <span className="text-slate-500">Tipo:</span>{" "}
          {detail.attention?.attentionType ?
            (attentionTypeLabel[detail.attention.attentionType] ??
              detail.attention.attentionType)
          : "—"}
        </p>
        <p>
          <span className="text-slate-500">Prioridad:</span>{" "}
          {detail.diagnostic.frozenPriorityLabel ?? "—"}
        </p>
        <p>
          <span className="text-slate-500">Equipo:</span> {detail.assetLabel}
        </p>
      </DetailSection>
      <DetailSection title="Relaciones navegables">
        <RelationLinks links={relationLinks} />
      </DetailSection>
      <WarrantyGerenteActions
        diagnosticId={id}
        status={detail.diagnostic.status}
        attentionType={detail.attention?.attentionType}
      />
      <WarrantyCeoCommercialButton
        diagnosticId={id}
        attentionType={detail.attention?.attentionType}
        warrantyDecision={detail.diagnostic.warrantyDecision}
        commercialOverride={detail.diagnostic.warrantyCommercialOverride}
        actorCanCeo={actorCanCeo}
      />
      <DiagnosticActionsPanel
        diagnosticId={id}
        status={detail.diagnostic.status}
        readOnly={readOnly}
        equiId={detail.attention?.equiId}
      />
      {!readOnly && (
        <ExternalServicePanel
          diagnosticId={id}
          equiId={detail.attention?.equiId}
          suppliers={suppliers.map((s) => ({
            id: s.id,
            legalName: s.legalName,
          }))}
        />
      )}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Bitácora</h2>
        <ul className="mt-3 divide-y text-sm">
          {entries.length === 0 && <li className="py-2 text-slate-500">Sin entradas.</li>}
          {entries.map((e) => (
            <li key={e.id} className="py-2">
              <p>{e.body}</p>
              <p className="text-xs text-slate-500">
                {e.authorName} · {new Date(e.createdAt).toLocaleString("es-MX")}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <FunctionalHistoryPanel entityType="diagnostic" entityId={id} />
    </div>
  );
}
