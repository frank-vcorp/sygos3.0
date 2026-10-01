import Link from "next/link";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { UserCreateForm } from "@/components/admin/user-admin-forms";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import { getAuthContext } from "@/server/auth/session";
import { assignableRoles, canManageUsers } from "@/server/rbac/users-admin";

export const dynamic = "force-dynamic";

export default async function NuevoUsuarioPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageUsers(auth.actor.role) || auth.viewAsActive) {
    redirect("/configuracion/usuarios");
  }

  const db = getDb();
  const companyRows = await db
    .select()
    .from(companies)
    .where(inArray(companies.id, auth.companyIds));

  const roles = [
    ...new Set([
      ...assignableRoles(auth.actor.role, "SYSTRON"),
      ...assignableRoles(auth.actor.role, "SERVOMOTORES"),
    ]),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/configuracion/usuarios"
        className="text-sm text-sky-800 hover:underline"
      >
        ← Usuarios
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">Nuevo usuario</h1>
      <UserCreateForm
        companies={companyRows.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
        }))}
        defaultHomeCompanyId={auth.activeCompany.id}
        assignableRoles={roles}
      />
    </div>
  );
}
