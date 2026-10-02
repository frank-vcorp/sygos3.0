import { redirect } from "next/navigation";
import { HrActionButton } from "@/components/hr/hr-forms";
import { listVacationRequests } from "@/server/hr/vacations";
import { getAuthContext } from "@/server/auth/session";
import { canApproveVacations, canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function VacacionesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  const rows = await listVacationRequests(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Vacaciones</h1>
      <p className="text-sm text-slate-500">Jefe registra · CEO/Admin autoriza · prima 25% en nómina.</p>
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-4 py-3">
            <span>
              {r.weekdayDays} d hábiles · {r.status}
            </span>
            {canApproveVacations(auth.effective.role) && r.status === "PENDIENTE" && (
              <HrActionButton
                href="/api/hr/vacations"
                body={{ action: "approve", requestId: r.id }}
                label="Autorizar"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
