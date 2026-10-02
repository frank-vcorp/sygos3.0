import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companies, companySettings } from "@/db/schema";

export async function ensureCompanySettings(companyId: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(companySettings)
    .where(eq(companySettings.companyId, companyId))
    .limit(1);
  if (existing) return existing;

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  const [inserted] = await db
    .insert(companySettings)
    .values({
      companyId,
      tradeName: company?.name ?? null,
    })
    .returning();
  return inserted;
}

export async function getCompanySettings(companyId: string) {
  return ensureCompanySettings(companyId);
}

export async function updateCompanySettings(
  companyId: string,
  patch: Partial<{
    tradeName: string | null;
    taxLegalName: string | null;
    taxRfc: string | null;
    taxRegime: string | null;
    taxZip: string | null;
    address: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    logoUrl: string | null;
    directPurchaseMonthlyLimitMxn: number;
    directPurchaseIndividualLimitMxn: number;
    servomotoresInventoryEnabled: boolean;
    testModeEnabled: boolean;
    bonusPunctualityMxn: number;
    bonusProductivityMxn: number;
  }>,
) {
  const db = getDb();
  await ensureCompanySettings(companyId);
  const [updated] = await db
    .update(companySettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(companySettings.companyId, companyId))
    .returning();
  return updated;
}
