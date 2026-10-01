import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { viewAsLogs } from "@/db/schema";
import {
  getAuthContext,
  updateSessionEffectiveUser,
} from "@/server/auth/session";
import { canUseViewAs } from "@/server/rbac/roles";

export async function POST() {
  const auth = await getAuthContext();
  if (!auth || !canUseViewAs(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (auth.viewAsActive) {
    const db = getDb();
    await db
      .update(viewAsLogs)
      .set({ endedAt: new Date() })
      .where(
        and(
          eq(viewAsLogs.actorUserId, auth.actor.id),
          eq(viewAsLogs.targetUserId, auth.effective.id),
          isNull(viewAsLogs.endedAt),
        ),
      );
  }

  await updateSessionEffectiveUser(auth.sessionId, auth.actor.id);

  return NextResponse.json({ ok: true });
}
