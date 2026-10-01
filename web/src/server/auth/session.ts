import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/auth/constants";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  companies,
  sessions,
  userCompanyAccess,
  users,
  type UserRole,
} from "@/db/schema";

const SESSION_DAYS = 14;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type AuthContext = {
  sessionId: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
  };
  effective: {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
  };
  activeCompany: {
    id: string;
    slug: string;
    name: string;
  };
  companyIds: string[];
  mustChangePassword: boolean;
  viewAsActive: boolean;
};

export async function createSession(params: {
  userId: string;
  activeCompanyId: string;
  effectiveUserId?: string;
}): Promise<string> {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await db.insert(sessions).values({
    userId: params.userId,
    tokenHash,
    activeCompanyId: params.activeCompanyId,
    effectiveUserId: params.effectiveUserId ?? params.userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const tokenHash = hashToken(token);
  const now = new Date();

  const [row] = await db
    .select({
      sessionId: sessions.id,
      sessionUserId: sessions.userId,
      activeCompanyId: sessions.activeCompanyId,
      effectiveUserId: sessions.effectiveUserId,
    })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);

  if (!row) return null;

  const [actor] = await db
    .select()
    .from(users)
    .where(eq(users.id, row.sessionUserId))
    .limit(1);
  const [effective] = await db
    .select()
    .from(users)
    .where(eq(users.id, row.effectiveUserId))
    .limit(1);
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, row.activeCompanyId))
    .limit(1);

  if (!actor || !effective || !company || !actor.isActive || !effective.isActive) {
    return null;
  }

  const access = await db
    .select({ companyId: userCompanyAccess.companyId })
    .from(userCompanyAccess)
    .where(eq(userCompanyAccess.userId, effective.id));

  let companyIds = access.map((a) => a.companyId);
  if (companyIds.length === 0 && effective.homeCompanyId) {
    companyIds = [effective.homeCompanyId];
  }
  if (actor.role === "ADMINISTRADOR") {
    const all = await db.select({ id: companies.id }).from(companies);
    companyIds = all.map((c) => c.id);
  }

  if (!companyIds.includes(company.id)) {
    return null;
  }

  return {
    sessionId: row.sessionId,
    actor: {
      id: actor.id,
      username: actor.username,
      displayName: actor.displayName,
      role: actor.role,
    },
    effective: {
      id: effective.id,
      username: effective.username,
      displayName: effective.displayName,
      role: effective.role,
    },
    activeCompany: {
      id: company.id,
      slug: company.slug,
      name: company.name,
    },
    companyIds,
    mustChangePassword: actor.mustChangePassword,
    viewAsActive: row.effectiveUserId !== row.sessionUserId,
  };
}

export async function updateSessionCompany(
  sessionId: string,
  companyId: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({ activeCompanyId: companyId })
    .where(eq(sessions.id, sessionId));
}

export async function updateSessionEffectiveUser(
  sessionId: string,
  effectiveUserId: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(sessions)
    .set({ effectiveUserId })
    .where(eq(sessions.id, sessionId));
}
