import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  servicePriorityConfigs,
  type priorityCatalogEnum,
} from "@/db/schema";

type Catalog = (typeof priorityCatalogEnum.enumValues)[number];

export async function ensureDefaultPriorities(companyId: string) {
  const db = getDb();
  const defaults: {
    catalog: Catalog;
    code: string;
    label: string;
    priceMxn: number;
    incrementPct: number;
    targetMinDays: number | null;
    targetMaxDays: number | null;
    slaMaxDays: number;
  }[] = [
    {
      catalog: "DIAGNOSTICO",
      code: "NORMAL",
      label: "Normal",
      priceMxn: 0,
      incrementPct: 0,
      targetMinDays: 5,
      targetMaxDays: 10,
      slaMaxDays: 10,
    },
    {
      catalog: "DIAGNOSTICO",
      code: "ALTA",
      label: "Alta",
      priceMxn: 3500,
      incrementPct: 0,
      targetMinDays: 2,
      targetMaxDays: 5,
      slaMaxDays: 5,
    },
    {
      catalog: "DIAGNOSTICO",
      code: "EXPRESS",
      label: "Exprés",
      priceMxn: 4500,
      incrementPct: 0,
      targetMinDays: null,
      targetMaxDays: null,
      slaMaxDays: 1,
    },
    {
      catalog: "REPARACION",
      code: "NORMAL",
      label: "Normal",
      priceMxn: 0,
      incrementPct: 0,
      targetMinDays: 5,
      targetMaxDays: 10,
      slaMaxDays: 10,
    },
    {
      catalog: "REPARACION",
      code: "ALTA",
      label: "Alta",
      priceMxn: 0,
      incrementPct: 10,
      targetMinDays: 2,
      targetMaxDays: 5,
      slaMaxDays: 5,
    },
    {
      catalog: "REPARACION",
      code: "EXPRESS",
      label: "Exprés",
      priceMxn: 0,
      incrementPct: 20,
      targetMinDays: null,
      targetMaxDays: null,
      slaMaxDays: 1,
    },
  ];

  for (const row of defaults) {
    const [existing] = await db
      .select()
      .from(servicePriorityConfigs)
      .where(
        and(
          eq(servicePriorityConfigs.companyId, companyId),
          eq(servicePriorityConfigs.catalog, row.catalog),
          eq(servicePriorityConfigs.code, row.code),
        ),
      )
      .limit(1);
    if (!existing) {
      await db.insert(servicePriorityConfigs).values({ companyId, ...row });
    }
  }
}

export async function getPrioritySnapshot(params: {
  companyId: string;
  catalog: Catalog;
  code: string;
}) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(servicePriorityConfigs)
    .where(
      and(
        eq(servicePriorityConfigs.companyId, params.companyId),
        eq(servicePriorityConfigs.catalog, params.catalog),
        eq(servicePriorityConfigs.code, params.code),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listPriorities(companyId: string, catalog: Catalog) {
  const db = getDb();
  return db
    .select()
    .from(servicePriorityConfigs)
    .where(
      and(
        eq(servicePriorityConfigs.companyId, companyId),
        eq(servicePriorityConfigs.catalog, catalog),
      ),
    );
}
