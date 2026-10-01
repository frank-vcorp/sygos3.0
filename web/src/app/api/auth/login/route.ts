import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { companies, userCompanyAccess, users } from "@/db/schema";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { username, password } = bodySchema.parse(json);
    const db = getDb();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos." },
        { status: 401 },
      );
    }

    let activeCompanyId = user.homeCompanyId;
    const access = await db
      .select({ companyId: userCompanyAccess.companyId })
      .from(userCompanyAccess)
      .where(eq(userCompanyAccess.userId, user.id));

    if (user.role === "ADMINISTRADOR") {
      const [systron] = await db
        .select()
        .from(companies)
        .where(eq(companies.slug, "SYSTRON"))
        .limit(1);
      activeCompanyId = systron?.id ?? activeCompanyId;
    } else if (access[0]) {
      activeCompanyId = access[0].companyId;
    }

    if (!activeCompanyId) {
      return NextResponse.json(
        { error: "El usuario no tiene empresa asignada." },
        { status: 403 },
      );
    }

    await createSession({
      userId: user.id,
      activeCompanyId,
    });

    return NextResponse.json({
      ok: true,
      mustChangePassword: user.mustChangePassword,
    });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
