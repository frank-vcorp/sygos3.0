import { and, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clients,
  equipmentBrands,
  equipmentTypes,
  equiUnits,
  users,
} from "@/db/schema";
import {
  formatEquiFolio,
  nextFolioValue,
} from "@/server/masters/folios";

export async function listEquiTypes(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(equipmentTypes)
    .where(
      and(eq(equipmentTypes.companyId, companyId), eq(equipmentTypes.isActive, true)),
    )
    .orderBy(equipmentTypes.name);
}

export async function listEquiBrands(companyId: string) {
  const db = getDb();
  return db
    .select()
    .from(equipmentBrands)
    .where(
      and(eq(equipmentBrands.companyId, companyId), eq(equipmentBrands.isActive, true)),
    )
    .orderBy(equipmentBrands.name);
}

export async function ensureEquiType(companyId: string, name: string) {
  const db = getDb();
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(equipmentTypes)
    .where(
      and(eq(equipmentTypes.companyId, companyId), eq(equipmentTypes.name, trimmed)),
    )
    .limit(1);
  if (existing) return existing;
  const [inserted] = await db
    .insert(equipmentTypes)
    .values({ companyId, name: trimmed })
    .returning();
  return inserted;
}

export async function ensureEquiBrand(companyId: string, name: string) {
  const db = getDb();
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(equipmentBrands)
    .where(
      and(eq(equipmentBrands.companyId, companyId), eq(equipmentBrands.name, trimmed)),
    )
    .limit(1);
  if (existing) return existing;
  const [inserted] = await db
    .insert(equipmentBrands)
    .values({ companyId, name: trimmed })
    .returning();
  return inserted;
}

export async function listEquiUnits(params: {
  companyId: string;
  clientId?: string;
  q?: string;
  custodyStatus?: string;
}) {
  const db = getDb();
  const conditions = [eq(equiUnits.companyId, params.companyId)];
  if (params.clientId) {
    conditions.push(eq(equiUnits.clientId, params.clientId));
  }
  if (params.custodyStatus) {
    conditions.push(
      eq(
        equiUnits.custodyStatus,
        params.custodyStatus as (typeof equiUnits.$inferSelect)["custodyStatus"],
      ),
    );
  }
  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    conditions.push(
      or(
        ilike(equiUnits.model, term),
        ilike(equiUnits.serialNumber, term),
        ilike(equiUnits.description, term),
      )!,
    );
  }
  const rows = await db
    .select({
      id: equiUnits.id,
      folioNumber: equiUnits.folioNumber,
      model: equiUnits.model,
      custodyStatus: equiUnits.custodyStatus,
      clientName: clients.legalName,
      typeName: equipmentTypes.name,
      brandName: equipmentBrands.name,
      createdAt: equiUnits.createdAt,
    })
    .from(equiUnits)
    .innerJoin(clients, eq(clients.id, equiUnits.clientId))
    .innerJoin(equipmentTypes, eq(equipmentTypes.id, equiUnits.typeId))
    .innerJoin(equipmentBrands, eq(equipmentBrands.id, equiUnits.brandId))
    .where(and(...conditions))
    .orderBy(desc(equiUnits.createdAt));

  return rows.map((r) => ({
    ...r,
    folio: formatEquiFolio(r.folioNumber),
  }));
}

export async function getEquiDetail(companyId: string, equiId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(equiUnits)
    .where(and(eq(equiUnits.id, equiId), eq(equiUnits.companyId, companyId)))
    .limit(1);
  if (!row) return null;
  const [client] = await db
    .select({ legalName: clients.legalName })
    .from(clients)
    .where(eq(clients.id, row.clientId))
    .limit(1);
  const [type] = await db
    .select({ name: equipmentTypes.name })
    .from(equipmentTypes)
    .where(eq(equipmentTypes.id, row.typeId))
    .limit(1);
  const [brand] = await db
    .select({ name: equipmentBrands.name })
    .from(equipmentBrands)
    .where(eq(equipmentBrands.id, row.brandId))
    .limit(1);
  return {
    equi: row,
    folio: formatEquiFolio(row.folioNumber),
    clientName: client?.legalName ?? "—",
    typeName: type?.name ?? "—",
    brandName: brand?.name ?? "—",
  };
}

export async function createEquiUnit(params: {
  companyId: string;
  actorUserId: string;
  clientId: string;
  typeId: string;
  brandId: string;
  model: string;
  description?: string;
  serialNumber?: string;
}) {
  const db = getDb();
  const folioNumber = await nextFolioValue(params.companyId, "EQUI");
  const [inserted] = await db
    .insert(equiUnits)
    .values({
      companyId: params.companyId,
      clientId: params.clientId,
      folioNumber,
      typeId: params.typeId,
      brandId: params.brandId,
      model: params.model.trim(),
      description: params.description?.trim() || null,
      serialNumber: params.serialNumber?.trim() || null,
      custodyStatus: "AWAITING_ENTRY",
      createdByActorUserId: params.actorUserId,
    })
    .returning();
  return { ...inserted, folio: formatEquiFolio(folioNumber) };
}
