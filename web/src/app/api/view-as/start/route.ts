import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users, viewAsLogs } from "@/db/schema";
import {
  getAuthContext,
  updateSessionEffectiveUser,
} from "@/server/auth/session";
import { canUseViewAs } from "@/server/rbac/roles";

const bodySchema = z.object({
  targetUserId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canUseViewAs(auth.actor.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const { targetUserId } = bodySchema.parse(await request.json());
    if (targetUserId === auth.actor.id) {
      return NextResponse.json({ error: "Selecciona otro usuario." }, { status: 400 });
    }

    const db = getDb();
    const [target] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!target || !target.isActive || target.role === "ADMINISTRADOR") {
      return NextResponse.json({ error: "Usuario no válido." }, { status: 400 });
    }

    await db.insert(viewAsLogs).values({
      actorUserId: auth.actor.id,
      targetUserId: target.id,
    });

    await updateSessionEffectiveUser(auth.sessionId, target.id);

    return NextResponse.json({
      ok: true,
      effective: {
        displayName: target.displayName,
        role: target.role,
      },
    });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
