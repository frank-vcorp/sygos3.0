import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { UserEditForm } from "@/components/admin/user-admin-forms";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { assignableRoles, canManageUsers } from "@/server/rbac/users-admin";
import { getManagedUser } from "@/server/users/admin";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function UsuarioDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageUsers(auth.actor.role) || auth.viewAsActive) {
    redirect("/configuracion/usuarios");
  }

  const { id } = await params;
  const detail = await getManagedUser({
    userId: id,
    activeCompanyId: auth.activeCompany.id,
    actorRole: auth.actor.role,
  });
  if (!detail) notFound();

  let homeCompanySlug: string | null = null;
  if (detail.user.homeCompanyId) {
    const db = getDb();
    const [home] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, detail.user.homeCompanyId))
      .limit(1);
    homeCompanySlug = home?.slug ?? null;
  }

  const roles = assignableRoles(
    auth.actor.role,
    (homeCompanySlug ?? auth.activeCompany.slug) as CompanySlug,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/configuracion/usuarios"
        className="text-sm text-sky-800 hover:underline"
      >
        ← Usuarios
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">
        {detail.user.displayName}
      </h1>
      <UserEditForm
        user={{
          id: detail.user.id,
          username: detail.user.username,
          displayName: detail.user.displayName,
          role: detail.user.role,
          isActive: detail.user.isActive,
          vendorDiscountLimitPct: detail.user.vendorDiscountLimitPct,
          homeCompanySlug,
        }}
        assignableRoles={roles}
      />
    </div>
  );
}
