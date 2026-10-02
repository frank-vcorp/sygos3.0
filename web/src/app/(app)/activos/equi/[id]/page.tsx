import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MovementActions } from "@/components/assets/asset-forms";
import type { CompanySlug } from "@/lib/company";
import { getEquiDetail } from "@/server/assets/equi";
import { listPhysicalMovements } from "@/server/assets/custody";
import { getAuthContext } from "@/server/auth/session";
import { canOperateSystronWarehouse, canSeeEqui } from "@/server/rbac/assets";
import { DetailSection, RelationLinks } from "@/components/discovery/detail-section";
import { equiCustodyLabel } from "@/lib/discovery/labels/assets";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { listEquiRelationLinks } from "@/server/assets/asset-relations";
import { getEquiJourneyHint } from "@/server/journey/asset-handoffs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EquiDetailPage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canSeeEqui(auth.effective.role, slug)) redirect("/inicio");

  const { id } = await params;
  const detail = await getEquiDetail(auth.activeCompany.id, id);
  if (!detail) notFound();

  const movements = await listPhysicalMovements({
    companyId: auth.activeCompany.id,
    entityType: "EQUI",
    entityId: id,
  });

  const canMove = canOperateSystronWarehouse(auth.effective.role, slug);
  const relationLinks = await listEquiRelationLinks({
    companyId: auth.activeCompany.id,
    equiId: id,
    clientId: detail.equi.clientId,
  });

  const journeyHint = await getEquiJourneyHint({
    equiId: id,
    companyId: auth.activeCompany.id,
    custodyStatus: detail.equi.custodyStatus,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/activos/equi" className="text-sm text-sky-800 hover:underline">
        ← EQUI
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{detail.folio}</h1>
        <p className="text-sm text-slate-600">
          {detail.clientName} · {detail.typeName} · {detail.brandName} · {detail.equi.model}
        </p>
        <p className="text-sm text-slate-500">
          Custodia:{" "}
          {equiCustodyLabel[detail.equi.custodyStatus ?? ""] ?? detail.equi.custodyStatus}
        </p>
      </div>
      <JourneyPanel title="Qué falta para avanzar" hint={journeyHint} />
      <DetailSection title="Relaciones navegables" description="§4.1 — historial operativo del equipo.">
        <RelationLinks links={relationLinks} />
      </DetailSection>
      {canMove && (
        <MovementActions
          entityKind="equi"
          entityId={id}
          allowedTypes={[
            { value: "ENTRY", label: "Entrada almacén" },
            { value: "EXIT", label: "Salida" },
            { value: "TRIAL_OUT", label: "Salida a prueba" },
            { value: "TRIAL_RETURN", label: "Retorno de prueba" },
            { value: "DEFINITIVE_EXIT", label: "Salida definitiva" },
          ]}
        />
      )}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Historial físico</h2>
        <ul className="mt-3 divide-y text-sm">
          {movements.length === 0 && <li className="py-2 text-slate-500">Sin movimientos.</li>}
          {movements.map((m) => (
            <li key={m.id} className="py-2">
              {m.movementType} · {m.motive ?? "—"} ·{" "}
              {new Date(m.occurredAt).toLocaleString("es-MX")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
