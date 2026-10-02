import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companySettings } from "@/db/schema";

export async function isTestModeEnabled(companyId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ testModeEnabled: companySettings.testModeEnabled })
    .from(companySettings)
    .where(eq(companySettings.companyId, companyId))
    .limit(1);
  return row?.testModeEnabled ?? false;
}

export async function setTestModeEnabled(companyId: string, enabled: boolean) {
  const db = getDb();
  await db
    .insert(companySettings)
    .values({ companyId, testModeEnabled: enabled })
    .onConflictDoUpdate({
      target: companySettings.companyId,
      set: { testModeEnabled: enabled, updatedAt: new Date() },
    });
}
