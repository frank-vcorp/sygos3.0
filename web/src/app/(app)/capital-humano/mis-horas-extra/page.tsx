import { redirect } from "next/navigation";
import { OvertimeRequestForm, HrActionButton } from "@/components/hr/hr-forms";
import { listOvertimeForCompany } from "@/server/hr/overtime";
import { getAuthContext } from "@/server/auth/session";
import {
  canApproveOvertimeBoss,
  canApproveOvertimeCeo,
  canSeeOwnOvertime,
} from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function MisHorasExtraPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeOwnOvertime(auth.effective.role)) redirect("/inicio");

  const rows = await listOvertimeForCompany(auth.activeCompany.id);
  const mine = rows.filter((r) => r.requestedByUserId === auth.effective.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mis horas extra</h1>
      <OvertimeRequestForm />
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span>
              {r.hours}h {r.rateKind} · {r.status} · {r.amountMxn ?? 0} MXN
            </span>
            {canApproveOvertimeBoss(auth.effective.role) && r.status === "PENDIENTE_JEFE" && (
              <HrActionButton
                href={`/api/hr/overtime/${r.id}/approve`}
                body={{ stage: "jefe" }}
                label="Validar jefe"
              />
            )}
            {canApproveOvertimeCeo(auth.effective.role) && r.status === "PENDIENTE_CEO" && (
              <HrActionButton
                href={`/api/hr/overtime/${r.id}/approve`}
                body={{ stage: "ceo" }}
                label="Autorizar CEO"
              />
            )}
          </li>
        ))}
        {mine.length === 0 && rows.length === 0 && (
          <li className="px-4 py-8 text-center text-slate-500">Sin solicitudes.</li>
        )}
      </ul>
    </div>
  );
}
