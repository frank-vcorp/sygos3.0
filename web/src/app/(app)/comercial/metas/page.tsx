import { redirect } from "next/navigation";
import { GoalsAdminPanel } from "@/components/commercial/goals-admin-panel";
import { listGoalTypes } from "@/server/commercial/goals";
import { listManagedUsers } from "@/server/users/admin";
import { getAuthContext } from "@/server/auth/session";
import { canManageCommercialGoals } from "@/server/rbac/commercial";

export const dynamic = "force-dynamic";

export default async function MetasComercialesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageCommercialGoals(auth.effective.role)) redirect("/inicio");

  const [types, users] = await Promise.all([
    listGoalTypes(auth.activeCompany.id),
    listManagedUsers({
      activeCompanyId: auth.activeCompany.id,
      actorRole: auth.effective.role,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Metas comerciales</h1>
      <p className="text-sm text-slate-500">
        Objetivos mensuales por vendedor (SYSTRON). Meta inicial: clientes nuevos por primera
        operación real.
      </p>
      <GoalsAdminPanel
        goalTypes={types.map((t) => ({ id: t.id, label: t.label, code: t.code }))}
        users={users.map((u) => ({ id: u.id, displayName: u.displayName }))}
      />
    </div>
  );
}
