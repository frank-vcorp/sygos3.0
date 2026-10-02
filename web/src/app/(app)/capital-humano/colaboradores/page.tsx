import Link from "next/link";
import { redirect } from "next/navigation";
import { EmployeeCreateForm } from "@/components/hr/hr-forms";
import { ListShell } from "@/components/masters/list-shell";
import { employeeStatusLabel } from "@/lib/discovery/labels/hr";
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
      {canManageEmployees(auth.effective.role) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <EmployeeCreateForm />
        </div>
      )}
      <ListShell
        title="Colaboradores"
        description="§9.1 — el nombre abre detalle con vacaciones, nómina y horas extra cuando aplique."
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Usuario ERP</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Saldo vacaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ employee: e, userName }) => (
              <tr key={e.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/capital-humano/colaboradores/${e.id}`}
                    className="font-medium text-sygos-teal hover:underline"
                  >
                    {e.legalName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{userName ?? "—"}</td>
                <td className="px-4 py-3">
                  {employeeStatusLabel[e.status] ?? e.status}
                </td>
                <td className="px-4 py-3 text-right">{e.vacationBalanceDays} d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
    </div>
  );
}
