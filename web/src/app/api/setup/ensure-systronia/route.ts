import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  companies,
  userCompanyAccess,
  users,
} from "@/db/schema";
import { hashPassword } from "@/server/auth/password";

const bodySchema = z.object({
  setupKey: z.string().min(8),
  password: z.string().min(10),
});

/**
 * Recuperación controlada: requiere SETUP_BOOTSTRAP_KEY en el runtime. Quitar tras usar.
 */
export async function POST(request: Request) {
  const expected = process.env.SETUP_BOOTSTRAP_KEY;
  if (!expected) {
    return NextResponse.json({ error: "Bootstrap deshabilitado." }, { status: 404 });
  }

  try {
    const { setupKey, password } = bodySchema.parse(await request.json());
    if (setupKey !== expected) {
      return NextResponse.json({ error: "Clave inválida." }, { status: 403 });
    }

    const db = getDb();
    const passwordHash = await hashPassword(password);

    async function ensureCompany(slug: string, name: string) {
      const [row] = await db
        .select()
        .from(companies)
        .where(eq(companies.slug, slug))
        .limit(1);
      if (row) return row;
      const [inserted] = await db
        .insert(companies)
        .values({ slug, name })
        .returning();
      return inserted;
    }

    const systron = await ensureCompany("SYSTRON", "SYSTRON");
    const servomotores = await ensureCompany("SERVOMOTORES", "Servomotores");

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, "Systronia"))
      .limit(1);

    let userId: string;
    if (existing) {
      const [row] = await db
        .update(users)
        .set({
          passwordHash,
          mustChangePassword: true,
          isActive: true,
          role: "ADMINISTRADOR",
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      userId = row!.id;
    } else {
      const [row] = await db
        .insert(users)
        .values({
          username: "Systronia",
          displayName: "Systronia",
          passwordHash,
          role: "ADMINISTRADOR",
          mustChangePassword: true,
          homeCompanyId: systron.id,
        })
        .returning();
      userId = row.id;
    }

    for (const company of [systron, servomotores]) {
      const [link] = await db
        .select()
        .from(userCompanyAccess)
        .where(
          and(
            eq(userCompanyAccess.userId, userId),
            eq(userCompanyAccess.companyId, company.id),
          ),
        )
        .limit(1);
      if (!link) {
        await db.insert(userCompanyAccess).values({
          userId,
          companyId: company.id,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        "Systronia listo. Cambia la contraseña al entrar. Elimina SETUP_BOOTSTRAP_KEY del runtime.",
    });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
