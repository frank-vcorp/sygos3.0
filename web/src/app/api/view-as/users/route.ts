import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { getAuthContext } from "@/server/auth/session";
import { canUseViewAs, roleLabel } from "@/server/rbac/roles";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canUseViewAs(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.isActive, true), ne(users.role, "ADMINISTRADOR")));

  return NextResponse.json({
    users: rows.map((u) => ({
      id: u.id,
      label: `${u.displayName} · ${roleLabel(u.role)}`,
      username: u.username,
    })),
  });
}
