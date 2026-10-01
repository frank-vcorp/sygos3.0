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
import { createManagedUser, listManagedUsers } from "@/server/users/admin";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageUsers(auth.actor.role) || auth.viewAsActive) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const meta = new URL(request.url).searchParams.get("meta");
  if (meta === "roles") {
    const slug = auth.activeCompany.slug as CompanySlug;
    return NextResponse.json({
      roles: assignableRoles(auth.actor.role, slug),
    });
  }

  const users = await listManagedUsers({
    activeCompanyId: auth.activeCompany.id,
    actorRole: auth.actor.role,
  });
  return NextResponse.json({ users });
}

const postSchema = z.object({
  username: z.string().min(2).max(64),
  displayName: z.string().min(1).max(128),
  role: z.enum(userRoleEnum.enumValues),
  homeCompanyId: z.string().uuid(),
  initialPassword: z.string().min(8),
  vendorDiscountLimitPct: z.number().int().min(0).max(100).nullable().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManageUsers(auth.actor.role) || auth.viewAsActive) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    if (
      body.role === "ADMINISTRADOR" &&
      !canSeeAdministratorAccounts(auth.actor.role)
    ) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const db = getDb();
    const [home] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, body.homeCompanyId))
      .limit(1);
    if (!home) {
      return NextResponse.json({ error: "Empresa base inválida." }, { status: 400 });
    }
    const homeSlug = home.slug as CompanySlug;
    const allowed = assignableRoles(auth.actor.role, homeSlug);
    if (!allowed.includes(body.role)) {
      return NextResponse.json({ error: "Rol no permitido." }, { status: 403 });
    }

    const user = await createManagedUser({
      actorUserId: auth.actor.id,
      activeCompanyId: auth.activeCompany.id,
      homeCompanyId: body.homeCompanyId,
      username: body.username,
      displayName: body.displayName,
      role: body.role,
      initialPassword: body.initialPassword,
      vendorDiscountLimitPct: body.vendorDiscountLimitPct,
    });
    return NextResponse.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    if (err instanceof Error && err.message === "ROLE_COMPANY_MISMATCH") {
      return NextResponse.json(
        { error: "El rol no corresponde a la empresa base del usuario." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "No se pudo crear (usuario duplicado o datos inválidos)." },
      { status: 400 },
    );
  }
}
