import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  diagnostics,
  directPurchases,
  financialMovements,
  fiscalDocuments,
  payments,
  payrollRuns,
  purchaseOrders,
  quotes,
  serviceAttentions,
  testModeSessionRoles,
  testModeSessionUsers,
  testModeSessions,
  users,
  workOrders,
  type UserRole,
} from "@/db/schema";
import { snapshotFoliosForSession, restoreFolioSnapshots } from "@/server/test-mode/folios";
import { clearTestOverlays } from "@/server/test-mode/overlays";

export async function getActiveTestModeSession() {
  const db = getDb();
  const [session] = await db
    .select()
    .from(testModeSessions)
    .where(eq(testModeSessions.active, true))
    .limit(1);
  if (!session) return null;

  const [userRows, roleRows] = await Promise.all([
    db
      .select({ userId: testModeSessionUsers.userId })
      .from(testModeSessionUsers)
      .where(eq(testModeSessionUsers.sessionId, session.id)),
    db
      .select({ role: testModeSessionRoles.role })
      .from(testModeSessionRoles)
      .where(eq(testModeSessionRoles.sessionId, session.id)),
  ]);

  return {
    session,
    userIds: userRows.map((r) => r.userId),
    roles: roleRows.map((r) => r.role),
  };
}

export async function isUserInActiveTestSession(params: {
  userId: string;
  role: UserRole;
}): Promise<boolean> {
  const active = await getActiveTestModeSession();
  if (!active) return false;
  if (active.userIds.includes(params.userId)) return true;
  return active.roles.includes(params.role);
}

export async function startTestModeSession(params: {
  startedByUserId: string;
  userIds: string[];
  roles: UserRole[];
}) {
  const db = getDb();
  await db
    .update(testModeSessions)
    .set({ active: false, endedAt: new Date() })
    .where(eq(testModeSessions.active, true));

  const [session] = await db
    .insert(testModeSessions)
    .values({
      startedByUserId: params.startedByUserId,
      active: true,
    })
    .returning();

  const uniqueUserIds = [...new Set(params.userIds)];
  const uniqueRoles = [...new Set(params.roles)];

  if (uniqueUserIds.length) {
    await db.insert(testModeSessionUsers).values(
      uniqueUserIds.map((userId) => ({
        sessionId: session.id,
        userId,
      })),
    );
  }
  if (uniqueRoles.length) {
    await db.insert(testModeSessionRoles).values(
      uniqueRoles.map((role) => ({
        sessionId: session.id,
        role,
      })),
    );
  }

  await snapshotFoliosForSession(session.id);

  return session;
}

export async function endActiveTestModeSession() {
  const db = getDb();
  const [updated] = await db
    .update(testModeSessions)
    .set({ active: false, endedAt: new Date() })
    .where(eq(testModeSessions.active, true))
    .returning();
  if (!updated) return null;

  const sessionId = updated.id;
  await restoreFolioSnapshots(sessionId);
  await clearTestOverlays(sessionId);

  const purge = [
    financialMovements,
    fiscalDocuments,
    payments,
    payrollRuns,
    quotes,
    workOrders,
    diagnostics,
    serviceAttentions,
    purchaseOrders,
    directPurchases,
  ] as const;
  for (const table of purge) {
    await db.delete(table).where(eq(table.testSessionId, sessionId));
  }

  return updated;
}

export async function listUsersForTestModePicker() {
  const db = getDb();
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.displayName));
}
