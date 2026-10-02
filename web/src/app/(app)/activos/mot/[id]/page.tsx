import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MovementActions } from "@/components/assets/asset-forms";
import type { CompanySlug } from "@/lib/company";
import { listPhysicalMovements } from "@/server/assets/custody";
import { resolveCompanyIds } from "@/server/assets/context";
import { getMotorDetail } from "@/server/assets/motors";
import { listBitacoraForMotorReadonly } from "@/server/ops/diagnostics";
import { getAuthContext } from "@/server/auth/session";
import { MotBaseQuoteButton } from "@/components/commercial/mot-base-quote-button";
import { canManageQuotePricing } from "@/server/rbac/commercial";
import { canOperateServomotoresCustody, canSeeMotors } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MotDetailPage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canSeeMotors(auth.effective.role, slug)) redirect("/inicio");

  const { id } = await params;
  const detail = await getMotorDetail(id);
  if (!detail) notFound();

  const ids = await resolveCompanyIds();
  const movements = await listPhysicalMovements({
    companyId: ids.servomotoresId,
    entityType: "MOT",
    entityId: id,
  });

  const canMove = canOperateServomotoresCustody(auth.effective.role, slug);
  const mirroredBitacora =
    slug === "SYSTRON" ? await listBitacoraForMotorReadonly(id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/activos/mot" className="text-sm text-sky-800 hover:underline">
        ← MOT
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{detail.folio}</h1>
        <p className="text-sm text-slate-600">
          {detail.clientName} · {detail.motor.identification}
        </p>
        <p className="text-sm text-slate-500">
          Origen {detail.originCompany?.name} · Custodia Servomotores:{" "}
          {detail.motor.servomotoresIntakeStatus}
        </p>
      </div>
      {slug === "SERVOMOTORES" &&
        detail.motor.origin === "SYSTRON" &&
        canManageQuotePricing(auth.effective.role) && (
          <MotBaseQuoteButton motorId={id} />
        )}
      {canMove && slug === "SERVOMOTORES" && (
        <MovementActions
          entityKind="motor"
          entityId={id}
          allowedTypes={[
            { value: "INGRESO", label: "Ingreso físico" },
            { value: "EGRESO", label: "Egreso" },
            { value: "TRIAL_OUT", label: "Salida a prueba" },
            { value: "TRIAL_RETURN", label: "Retorno de prueba" },
            { value: "DEFINITIVE_EXIT", label: "Egreso definitivo" },
          ]}
        />
      )}
      {mirroredBitacora.length > 0 && (
        <section className="rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold">Bitácora Servomotores (solo lectura)</h2>
          <ul className="mt-3 divide-y text-sm">
            {mirroredBitacora.map((e, i) => (
              <li key={i} className="py-2">
                {e.body} — {e.authorName}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Historial físico (Servomotores)</h2>
        <ul className="mt-3 divide-y text-sm">
          {movements.map((m) => (
            <li key={m.id} className="py-2">
              {m.movementType} · {new Date(m.occurredAt).toLocaleString("es-MX")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
