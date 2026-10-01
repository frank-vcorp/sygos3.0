import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { companies, userRoleEnum } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import {
  assignableRoles,
  canManageUsers,
  canSeeAdministratorAccounts,
} from "@/server/rbac/users-admin";
import { getManagedUser, updateManagedUser } from "@/server/users/admin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canManageUsers(auth.actor.role) || auth.viewAsActive) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getManagedUser({
    userId: id,
    activeCompanyId: auth.activeCompany.id,
    actorRole: auth.actor.role,
  });
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  displayName: z.string().min(1).optional(),
  role: z.enum(userRoleEnum.enumValues).optional(),
  isActive: z.boolean().optional(),
  vendorDiscountLimitPct: z.number().int().min(0).max(100).nullable().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canManageUsers(auth.actor.role) || auth.viewAsActive) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    if (id === auth.actor.id && body.isActive === false) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propia cuenta." },
        { status: 400 },
      );
    }
    if (
      body.role === "ADMINISTRADOR" &&
      !canSeeAdministratorAccounts(auth.actor.role)
    ) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    if (body.role) {
      const detail = await getManagedUser({
        userId: id,
        activeCompanyId: auth.activeCompany.id,
        actorRole: auth.actor.role,
      });
      const homeId = detail?.user.homeCompanyId;
      if (homeId) {
        const db = getDb();
        const [home] = await db
          .select()
          .from(companies)
          .where(eq(companies.id, homeId))
          .limit(1);
        if (home) {
          const allowed = assignableRoles(
            auth.actor.role,
            home.slug as CompanySlug,
          );
          if (!allowed.includes(body.role)) {
            return NextResponse.json({ error: "Rol no permitido." }, { status: 403 });
          }
        }
      }
    }

    const updated = await updateManagedUser({
      userId: id,
      activeCompanyId: auth.activeCompany.id,
      actorRole: auth.actor.role,
      patch: body,
    });
    if (!updated) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
