import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import { inventoryMovements, inventoryParts } from "@/db/schema";

export async function listInventoryParts(params: {
  companyId: string;
  q?: string;
}) {
  const db = getDb();
  const conditions = [
    eq(inventoryParts.companyId, params.companyId),
    eq(inventoryParts.isActive, true),
  ];
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(
        ilike(inventoryParts.partNumber, term),
        ilike(inventoryParts.description, term),
      )!,
    );
  }
  return db
    .select()
    .from(inventoryParts)
    .where(and(...conditions))
    .orderBy(inventoryParts.partNumber);
}

export async function createInventoryPart(params: {
  companyId: string;
  partNumber: string;
  description: string;
  minQty?: number | null;
  maxQty?: number | null;
}) {
  const db = getDb();
  const [inserted] = await db
    .insert(inventoryParts)
    .values({
      companyId: params.companyId,
      partNumber: params.partNumber.trim(),
      description: params.description.trim(),
      minQty: params.minQty ?? null,
      maxQty: params.maxQty ?? null,
    })
    .returning();
  return inserted;
}

export async function applyInventoryDelta(params: {
  companyId: string;
  partId: string;
  actorUserId: string;
  kind: "RECEIPT" | "ISSUE" | "ADJUSTMENT" | "IMPORT";
  quantityDelta: number;
  reference?: string;
}) {
  const db = getDb();
  const [part] = await db
    .select()
    .from(inventoryParts)
    .where(
      and(
        eq(inventoryParts.id, params.partId),
        eq(inventoryParts.companyId, params.companyId),
      ),
    )
    .limit(1);
  if (!part) return null;
  const nextQty = part.quantityOnHand + params.quantityDelta;
  if (nextQty < 0) return { error: "Existencia insuficiente." as const };

  await db.insert(inventoryMovements).values({
    companyId: params.companyId,
    partId: params.partId,
    kind: params.kind,
    quantityDelta: params.quantityDelta,
    reference: params.reference?.trim() || null,
    performedByActorUserId: params.actorUserId,
  });

  const [updated] = await db
    .update(inventoryParts)
    .set({ quantityOnHand: nextQty, updatedAt: new Date() })
    .where(eq(inventoryParts.id, params.partId))
    .returning();
  return { part: updated };
}

export type ImportLine = { partNumber: string; countedQty: number };

export async function previewInventoryImport(params: {
  companyId: string;
  lines: ImportLine[];
}) {
  const db = getDb();
  const parts = await db
    .select()
    .from(inventoryParts)
    .where(eq(inventoryParts.companyId, params.companyId));
  const byNumber = new Map(parts.map((p) => [p.partNumber.toLowerCase(), p]));

  return params.lines.map((line) => {
    const part = byNumber.get(line.partNumber.toLowerCase());
    if (!part) {
      return {
        partNumber: line.partNumber,
        status: "missing" as const,
        currentQty: 0,
        countedQty: line.countedQty,
        delta: line.countedQty,
      };
    }
    const delta = line.countedQty - part.quantityOnHand;
    return {
      partNumber: part.partNumber,
      partId: part.id,
      status: delta === 0 ? ("match" as const) : ("diff" as const),
      currentQty: part.quantityOnHand,
      countedQty: line.countedQty,
      delta,
    };
  });
}

export async function applyInventoryImport(params: {
  companyId: string;
  actorUserId: string;
  lines: ImportLine[];
}) {
  const preview = await previewInventoryImport(params);
  const results = [];
  for (const row of preview) {
    if (row.status === "missing" || !("partId" in row) || !row.partId) continue;
    if (row.delta === 0) continue;
    const res = await applyInventoryDelta({
      companyId: params.companyId,
      partId: row.partId,
      actorUserId: params.actorUserId,
      kind: "IMPORT",
      quantityDelta: row.delta,
      reference: "Inventario físico importado",
    });
    results.push(res);
  }
  return results;
}

export async function listInventoryMovements(partId: string) {
  const db = getDb();
  return db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.partId, partId))
    .orderBy(desc(inventoryMovements.createdAt));
}
