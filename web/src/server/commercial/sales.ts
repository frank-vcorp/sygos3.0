import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  clients,
  equipmentSaleLines,
  equipmentSales,
  quoteLines,
  quotes,
} from "@/db/schema";
import { formatSaleFolio, nextFolioValue } from "@/server/masters/folios";

export async function listEquipmentSales(companyId: string) {
  const db = getDb();
  const rows = await db
    .select({
      sale: equipmentSales,
      clientName: clients.legalName,
      quoteFolio: quotes.folioNumber,
    })
    .from(equipmentSales)
    .innerJoin(clients, eq(clients.id, equipmentSales.clientId))
    .innerJoin(quotes, eq(quotes.id, equipmentSales.quoteId))
    .where(eq(equipmentSales.companyId, companyId))
    .orderBy(desc(equipmentSales.createdAt));

  return rows.map((r) => ({
    ...r.sale,
    folio: formatSaleFolio(r.sale.folioNumber),
    clientName: r.clientName,
    quoteFolio: `COT-${r.quoteFolio}`,
  }));
}

export async function getEquipmentSaleDetail(companyId: string, saleId: string) {
  const db = getDb();
  const [sale] = await db
    .select()
    .from(equipmentSales)
    .where(
      and(eq(equipmentSales.id, saleId), eq(equipmentSales.companyId, companyId)),
    )
    .limit(1);
  if (!sale) return null;

  const lines = await db
    .select({
      line: equipmentSaleLines,
      concept: quoteLines.concept,
      unitPriceMxn: quoteLines.unitPriceMxn,
    })
    .from(equipmentSaleLines)
    .innerJoin(quoteLines, eq(quoteLines.id, equipmentSaleLines.quoteLineId))
    .where(eq(equipmentSaleLines.saleId, saleId));

  return {
    sale: { ...sale, folio: formatSaleFolio(sale.folioNumber) },
    lines,
  };
}

export async function createEquipmentSaleFromQuoteLines(params: {
  companyId: string;
  quoteId: string;
  clientId: string;
  actorUserId: string;
  lines: { quoteLineId: string; quantity: number }[];
}) {
  if (params.lines.length === 0) return null;
  const db = getDb();
  const folioNumber = await nextFolioValue(params.companyId, "VTA");
  const [sale] = await db
    .insert(equipmentSales)
    .values({
      companyId: params.companyId,
      folioNumber,
      quoteId: params.quoteId,
      clientId: params.clientId,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  await db.insert(equipmentSaleLines).values(
    params.lines.map((l) => ({
      saleId: sale.id,
      quoteLineId: l.quoteLineId,
      quantitySold: l.quantity,
    })),
  );

  return { ...sale, folio: formatSaleFolio(folioNumber) };
}

export async function recordSaleLineMovement(params: {
  companyId: string;
  saleId: string;
  lineId: string;
  kind: "receive" | "deliver";
  quantity: number;
}) {
  const db = getDb();
  const detail = await getEquipmentSaleDetail(params.companyId, params.saleId);
  if (!detail) return null;

  const row = detail.lines.find((l) => l.line.id === params.lineId);
  if (!row) return null;

  const qty = Math.max(1, params.quantity);
  const patch =
    params.kind === "receive"
      ? {
          quantityReceived: row.line.quantityReceived + qty,
        }
      : {
          quantityDelivered: row.line.quantityDelivered + qty,
        };

  const [updated] = await db
    .update(equipmentSaleLines)
    .set(patch)
    .where(eq(equipmentSaleLines.id, params.lineId))
    .returning();

  const allLines = await db
    .select()
    .from(equipmentSaleLines)
    .where(eq(equipmentSaleLines.saleId, params.saleId));

  const allDelivered = allLines.every(
    (l) => l.quantityDelivered >= l.quantitySold,
  );
  const anyPartial = allLines.some(
    (l) => l.quantityDelivered > 0 && l.quantityDelivered < l.quantitySold,
  );

  await db
    .update(equipmentSales)
    .set({
      status: allDelivered ? "CERRADA" : anyPartial ? "PARCIAL" : "ABIERTA",
      updatedAt: new Date(),
    })
    .where(eq(equipmentSales.id, params.saleId));

  return updated;
}

export async function listPendingDeliveries(companyId: string) {
  const sales = await listEquipmentSales(companyId);
  const db = getDb();
  const pending: {
    saleId: string;
    saleFolio: string;
    clientName: string;
    concept: string;
    pendingQty: number;
  }[] = [];

  for (const s of sales) {
    if (s.status === "CERRADA") continue;
    const lines = await db
      .select({
        line: equipmentSaleLines,
        concept: quoteLines.concept,
      })
      .from(equipmentSaleLines)
      .innerJoin(quoteLines, eq(quoteLines.id, equipmentSaleLines.quoteLineId))
      .where(eq(equipmentSaleLines.saleId, s.id));

    for (const { line, concept } of lines) {
      const ready = line.quantityReceived - line.quantityDelivered;
      if (ready > 0) {
        pending.push({
          saleId: s.id,
          saleFolio: s.folio,
          clientName: s.clientName,
          concept,
          pendingQty: ready,
        });
      }
    }
  }
  return pending;
}
