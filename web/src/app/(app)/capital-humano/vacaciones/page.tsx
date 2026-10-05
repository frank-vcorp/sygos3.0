import { redirect } from "next/navigation";
import { VacationListTabs } from "@/components/hr/vacation-list-tabs";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { ListShell } from "@/components/masters/list-shell";
import { getVacationJourneyHint } from "@/server/journey/hr-handoffs";
import { vacationStatusLabel } from "@/lib/discovery/labels/hr";
import { HrActionButton } from "@/components/hr/hr-forms";
import { listVacationRequests } from "@/server/hr/vacations";
import { getAuthContext } from "@/server/auth/session";
import { canApproveVacations, canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ vista?: string }> };

export default async function VacacionesPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  const { vista } = await searchParams;
  const activeView = vista === "todas" ? "todas" : "pendientes";

  const rows = await listVacationRequests(auth.activeCompany.id, {
    pendingOnly: activeView === "pendientes",
  });
  const pendingRow = rows.find(({ request }) => request.status === "PENDIENTE");
  const journeyHint = pendingRow
    ? getVacationJourneyHint("PENDIENTE")
    : getVacationJourneyHint("AUTORIZADA");

  return (
    <div className="space-y-4">
      <JourneyPanel title="Qué falta para avanzar" hint={journeyHint} />
      <VacationListTabs active={activeView} />
      <ListShell
        title="Vacaciones"
        description="§9.1 — jefe registra solicitud; CEO/Administrador autoriza o rechaza; impacto en asistencia y nómina."
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Colaborador</th>
              <th className="px-4 py-3">Días hábiles</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ request: r, employeeName }) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{employeeName}</td>
                <td className="px-4 py-3">{r.weekdayDays}</td>
                <td className="px-4 py-3">
                  {vacationStatusLabel[r.status] ?? r.status}
                </td>
                <td className="px-4 py-3 text-right">
                  {canApproveVacations(auth.effective.role) && r.status === "PENDIENTE" && (
                    <HrActionButton
                      href="/api/hr/vacations"
                      body={{ action: "approve", requestId: r.id }}
                      label="Autorizar"
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
