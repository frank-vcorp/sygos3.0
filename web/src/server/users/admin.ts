import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  companies,
  userCompanyAccess,
  users,
  type UserRole,
} from "@/db/schema";
import { hashPassword } from "@/server/auth/password";
import type { CompanySlug } from "@/lib/company";
import {
  canSeeAdministratorAccounts,
  roleMatchesHomeCompany,
  roleRequiresBothCompanies,
} from "@/server/rbac/users-admin";

export async function listManagedUsers(params: {
  activeCompanyId: string;
  actorRole: UserRole;
}) {
  const db = getDb();
  const accessRows = await db
    .select({ userId: userCompanyAccess.userId })
    .from(userCompanyAccess)
    .where(eq(userCompanyAccess.companyId, params.activeCompanyId));
  const userIds = accessRows.map((r) => r.userId);
  if (userIds.length === 0) return [];

  const conditions = [inArray(users.id, userIds)];
  if (!canSeeAdministratorAccounts(params.actorRole)) {
    conditions.push(ne(users.role, "ADMINISTRADOR"));
  }

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      homeCompanyId: users.homeCompanyId,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
      vendorDiscountLimitPct: users.vendorDiscountLimitPct,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(asc(users.displayName));

  const companyRows = await db.select().from(companies);
  const companyById = new Map(companyRows.map((c) => [c.id, c]));

  return rows.map((u) => ({
    ...u,
    homeCompanySlug: u.homeCompanyId
      ? (companyById.get(u.homeCompanyId)?.slug ?? null)
      : null,
  }));
}

export async function getManagedUser(params: {
  userId: string;
  activeCompanyId: string;
  actorRole: UserRole;
}) {
  const db = getDb();
  const [access] = await db
    .select()
    .from(userCompanyAccess)
    .where(
      and(
        eq(userCompanyAccess.userId, params.userId),
        eq(userCompanyAccess.companyId, params.activeCompanyId),
      ),
    )
    .limit(1);
  if (!access) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);
  if (!user) return null;
  if (
    user.role === "ADMINISTRADOR" &&
    !canSeeAdministratorAccounts(params.actorRole)
  ) {
    return null;
  }

  const accessList = await db
    .select({ companyId: userCompanyAccess.companyId })
    .from(userCompanyAccess)
    .where(eq(userCompanyAccess.userId, params.userId));

  return { user, companyIds: accessList.map((a) => a.companyId) };
}

export async function createManagedUser(params: {
  actorUserId: string;
  activeCompanyId: string;
  homeCompanyId: string;
  username: string;
  displayName: string;
  role: UserRole;
  initialPassword: string;
  vendorDiscountLimitPct?: number | null;
}) {
  const db = getDb();
  const [homeCompany] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, params.homeCompanyId))
    .limit(1);
  if (!homeCompany) throw new Error("INVALID_HOME");
  const homeSlug = homeCompany.slug as CompanySlug;
  if (!roleMatchesHomeCompany(params.role, homeSlug)) {
    throw new Error("ROLE_COMPANY_MISMATCH");
  }
  const passwordHash = await hashPassword(params.initialPassword);
  const [inserted] = await db
    .insert(users)
    .values({
      username: params.username.trim(),
      displayName: params.displayName.trim(),
      passwordHash,
      role: params.role,
      homeCompanyId: params.homeCompanyId,
      mustChangePassword: true,
      vendorDiscountLimitPct: params.vendorDiscountLimitPct ?? null,
    })
    .returning();

  const allCompanies = await db.select().from(companies);
  const companyIds = roleRequiresBothCompanies(params.role)
    ? allCompanies.map((c) => c.id)
    : [params.homeCompanyId];

  for (const companyId of companyIds) {
    await db.insert(userCompanyAccess).values({
      userId: inserted.id,
      companyId,
    });
  }

  return inserted;
}

export async function updateManagedUser(params: {
  userId: string;
  activeCompanyId: string;
  actorRole: UserRole;
  patch: Partial<{
    displayName: string;
    role: UserRole;
    isActive: boolean;
    vendorDiscountLimitPct: number | null;
    newPassword: string;
  }>;
}) {
  const existing = await getManagedUser({
    userId: params.userId,
    activeCompanyId: params.activeCompanyId,
    actorRole: params.actorRole,
  });
  if (!existing) return null;

  const db = getDb();
  const values: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (params.patch.displayName !== undefined) {
    values.displayName = params.patch.displayName.trim();
  }
  if (params.patch.role !== undefined) {
    values.role = params.patch.role;
  }
  if (params.patch.isActive !== undefined) {
    values.isActive = params.patch.isActive;
  }
  if (params.patch.vendorDiscountLimitPct !== undefined) {
    values.vendorDiscountLimitPct = params.patch.vendorDiscountLimitPct;
  }
  if (params.patch.newPassword) {
    values.passwordHash = await hashPassword(params.patch.newPassword);
    values.mustChangePassword = true;
  }

  const [updated] = await db
    .update(users)
    .set(values)
    .where(eq(users.id, params.userId))
    .returning();

  if (params.patch.role && roleRequiresBothCompanies(params.patch.role)) {
    const allCompanies = await db.select().from(companies);
    for (const c of allCompanies) {
      const [acc] = await db
        .select()
        .from(userCompanyAccess)
        .where(
          and(
            eq(userCompanyAccess.userId, params.userId),
            eq(userCompanyAccess.companyId, c.id),
          ),
        )
        .limit(1);
      if (!acc) {
        await db.insert(userCompanyAccess).values({
          userId: params.userId,
          companyId: c.id,
        });
      }
    }
  }

  return updated;
}
