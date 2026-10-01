import { eq } from "drizzle-orm";
import { getDb } from "./client";
import {
  companies,
  userCompanyAccess,
  users,
} from "./schema";
import { ensureCompanySettings } from "@/server/config/company-settings";
import { ensureSystronServomotoresSupplier } from "@/server/masters/suppliers";
import { hashPassword } from "@/server/auth/password";

async function main() {
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) {
    throw new Error(
      "Define ADMIN_INITIAL_PASSWORD para el seed (no commitear la contraseña).",
    );
  }

  const db = getDb();

  const companyRows = [
    { slug: "SYSTRON", name: "SYSTRON" },
    { slug: "SERVOMOTORES", name: "Servomotores" },
  ];

  for (const c of companyRows) {
    const [existing] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, c.slug))
      .limit(1);
    if (!existing) {
      await db.insert(companies).values(c);
    }
  }

  const allCompanies = await db.select().from(companies);
  for (const company of allCompanies) {
    await ensureCompanySettings(company.id);
  }
  const systron = allCompanies.find((c) => c.slug === "SYSTRON")!;
  const servomotores = allCompanies.find((c) => c.slug === "SERVOMOTORES")!;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, "Systronia"))
    .limit(1);

  if (!existingUser) {
    const passwordHash = await hashPassword(password);
    const [inserted] = await db
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

    for (const company of [systron, servomotores]) {
      await db.insert(userCompanyAccess).values({
        userId: inserted.id,
        companyId: company.id,
      });
    }

    console.log("Usuario Super Admin Systronia creado (must_change_password=true).");
    await ensureSystronServomotoresSupplier({
      systronCompanyId: systron.id,
      actorUserId: inserted.id,
    });
  } else {
    console.log("Seed omitido: Systronia ya existe.");
    await ensureSystronServomotoresSupplier({
      systronCompanyId: systron.id,
      actorUserId: existingUser.id,
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
