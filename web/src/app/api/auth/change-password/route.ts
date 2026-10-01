import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { getAuthContext } from "@/server/auth/session";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { currentPassword, newPassword } = bodySchema.parse(json);
    const db = getDb();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.actor.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "La contraseña actual no es correcta." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
