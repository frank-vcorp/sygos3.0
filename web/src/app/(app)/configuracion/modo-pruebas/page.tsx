import Link from "next/link";
import { redirect } from "next/navigation";
import { TestModePanel } from "@/components/config/test-mode-panel";
import {
  getActiveTestModeSession,
  listUsersForTestModePicker,
} from "@/server/config/test-mode-session";
import { getAuthContext } from "@/server/auth/session";
import { canManageCompanySettings } from "@/server/rbac/users-admin";

export const dynamic = "force-dynamic";

export default async function ModoPruebasPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageCompanySettings(auth.actor.role)) redirect("/inicio");

  const [users, active] = await Promise.all([
    listUsersForTestModePicker(),
    getActiveTestModeSession(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/configuracion/general" className="text-sm text-sygos-teal">
        ← Configuración general
      </Link>
      <h1 className="text-2xl font-semibold">Modo de pruebas</h1>
      <p className="text-sm text-slate-600">
        Solo administradores. Una sesión activa a la vez. Participantes ven
        advertencia persistente y simulación de integraciones externas.
      </p>
      <TestModePanel
        users={users}
        initialActive={
          active
            ? {
                session: {
                  id: active.session.id,
                  startedAt: active.session.startedAt.toISOString(),
                },
                userIds: active.userIds,
                roles: active.roles,
              }
            : null
        }
      />
    </div>
  );
}
