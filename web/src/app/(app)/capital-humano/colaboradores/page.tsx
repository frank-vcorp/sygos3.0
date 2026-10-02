import { redirect } from "next/navigation";
import { EmployeeCreateForm } from "@/components/hr/hr-forms";
import { listEmployees } from "@/server/hr/employees";
import { getAuthContext } from "@/server/auth/session";
import { canManageEmployees, canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  const rows = await listEmployees(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Colaboradores</h1>
      {canManageEmployees(auth.effective.role) && <EmployeeCreateForm />}
      <table className="min-w-full rounded-xl border bg-white text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-right">Vacaciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ employee: e }) => (
            <tr key={e.id} className="border-b">
              <td className="px-4 py-3">{e.legalName}</td>
              <td className="px-4 py-3">{e.status}</td>
              <td className="px-4 py-3 text-right">{e.vacationBalanceDays} d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
