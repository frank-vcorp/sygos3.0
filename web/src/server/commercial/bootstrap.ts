import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  commercialActivityCategories,
  commercialGoalTypes,
} from "@/db/schema";

export async function ensureCommercialCatalog(companyId: string) {
  const db = getDb();
  const categories = [
    "Visita",
    "Llamada",
    "Correo",
    "Seguimiento cotización",
    "Prospección",
  ];
  for (const name of categories) {
    const [exists] = await db
      .select({ id: commercialActivityCategories.id })
      .from(commercialActivityCategories)
      .where(
        and(
          eq(commercialActivityCategories.companyId, companyId),
          eq(commercialActivityCategories.name, name),
        ),
      )
      .limit(1);
    if (!exists) {
      await db
        .insert(commercialActivityCategories)
        .values({ companyId, name, countsForGoals: true });
    }
  }

  const goalTypes = [
    {
      code: "NEW_CLIENTS",
      label: "Clientes nuevos",
      sourceKind: "FIRST_OPERATION",
    },
    {
      code: "ACTIVITIES_EVIDENCE",
      label: "Actividades con evidencia",
      sourceKind: "ACTIVITIES",
    },
  ];
  for (const gt of goalTypes) {
    const [exists] = await db
      .select({ id: commercialGoalTypes.id })
      .from(commercialGoalTypes)
      .where(
        and(
          eq(commercialGoalTypes.companyId, companyId),
          eq(commercialGoalTypes.code, gt.code),
        ),
      )
      .limit(1);
    if (!exists) {
      await db.insert(commercialGoalTypes).values({ companyId, ...gt });
    }
  }
}

export async function listActivityCategories(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(commercialActivityCategories)
    .where(eq(commercialActivityCategories.companyId, companyId))
    .orderBy(commercialActivityCategories.name);
}
