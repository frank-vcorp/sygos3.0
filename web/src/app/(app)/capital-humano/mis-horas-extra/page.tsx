import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { overtimeStatusLabel } from "@/lib/discovery/labels/hr";
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <OvertimeRequestForm />
      </div>
      <ListShell
        title="Horas extra"
        description="§9 — colaborador solicita · jefe directo · CEO/Admin autoriza (Gerente SM excluido)."
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Horas</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Importe</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{r.hours}h</td>
                <td className="px-4 py-3">{r.rateKind}</td>
                <td className="px-4 py-3">
                  {overtimeStatusLabel[r.status] ?? r.status}
                </td>
                <td className="px-4 py-3 text-right">{r.amountMxn ?? 0} MXN</td>
                <td className="px-4 py-3 text-right">
                  {canApproveOvertimeBoss(auth.effective.role) &&
                    r.status === "PENDIENTE_JEFE" && (
                      <HrActionButton
                        href={`/api/hr/overtime/${r.id}/approve`}
                        body={{ stage: "jefe" }}
                        label="Validar jefe"
                      />
                    )}
                  {canApproveOvertimeCeo(auth.effective.role) &&
                    r.status === "PENDIENTE_CEO" && (
                      <HrActionButton
                        href={`/api/hr/overtime/${r.id}/approve`}
                        body={{ stage: "ceo" }}
                        label="Autorizar CEO"
                      />
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
    </div>
  );
}
