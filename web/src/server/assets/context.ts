import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companies } from "@/db/schema";
import type { CompanySlug } from "@/lib/company";

export async function resolveCompanyIds() {
  const db = getDb();
  const rows = await db.select().from(companies);
  const systron = rows.find((c) => c.slug === "SYSTRON");
  const servomotores = rows.find((c) => c.slug === "SERVOMOTORES");
  if (!systron || !servomotores) {
    throw new Error("Empresas base no configuradas.");
  }
  return {
    systronId: systron.id,
    servomotoresId: servomotores.id,
    bySlug: (slug: CompanySlug) =>
      slug === "SYSTRON" ? systron.id : servomotores.id,
  };
}
