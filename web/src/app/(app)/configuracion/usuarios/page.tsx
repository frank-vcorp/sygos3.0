import Link from "next/link";
import { redirect } from "next/navigation";
import { UsersListLink } from "@/components/admin/user-admin-forms";
import { ListShell } from "@/components/masters/list-shell";
import { roleLabel } from "@/lib/role-labels";
import { getAuthContext } from "@/server/auth/session";
import { canManageUsers } from "@/server/rbac/users-admin";
import { listManagedUsers } from "@/server/users/admin";

export const dynamic = "force-dynamic";

export default async function UsuariosAdminPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageUsers(auth.actor.role) || auth.viewAsActive) {
    redirect("/inicio");
  }

  const users = await listManagedUsers({
    activeCompanyId: auth.activeCompany.id,
    actorRole: auth.actor.role,
  });

  return (
    <ListShell
      title="Usuarios operativos"
      description="Alta, roles fijos y desactivación. CEO no ve cuentas Administrador."
      createHref="/configuracion/usuarios/nuevo"
      createLabel="Nuevo usuario"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Usuario</th>
            <th className="px-4 py-3 font-medium">Rol</th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                No hay usuarios visibles en esta empresa.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <UsersListLink id={u.id} label={u.displayName} />
              </td>
              <td className="px-4 py-3 text-slate-600">{u.username}</td>
              <td className="px-4 py-3 text-slate-600">{roleLabel(u.role)}</td>
              <td className="px-4 py-3">
                {u.isActive ? (
                  <span className="text-emerald-700">Activo</span>
                ) : (
                  <span className="text-slate-400">Inactivo</span>
                )}
                {u.mustChangePassword && (
                  <span className="ml-2 text-xs text-amber-700">
                    Pend. contraseña
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        Contexto: {auth.activeCompany.name}.{" "}
        <Link href="/configuracion/general" className="text-sky-800 hover:underline">
          Configuración general
        </Link>
      </p>
    </ListShell>
  );
}
