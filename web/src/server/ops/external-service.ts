import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  diagnostics,
  equiUnits,
  externalServiceCases,
  suppliers,
} from "@/db/schema";
import { confirmEquiMovement } from "@/server/assets/custody";

export async function sendDiagnosticToExternalVendor(params: {
  companyId: string;
  diagnosticId: string;
  supplierId: string;
  actorUserId: string;
  equiId: string;
  vendorDocumentRef?: string;
}) {
  const db = getDb();
  const [diag] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, params.diagnosticId))
    .limit(1);
  if (!diag || diag.companyId !== params.companyId) return null;

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, params.supplierId))
    .limit(1);
  if (!supplier) return null;

  const move = await confirmEquiMovement({
    companyId: params.companyId,
    equiId: params.equiId,
    actorUserId: params.actorUserId,
    movementType: "EXIT",
    motive: "Salida a proveedor externo",
    receiverName: supplier.legalName,
  });
  if ("error" in move) return null;

  await db
    .update(equiUnits)
    .set({ custodyStatus: "AT_EXTERNAL_VENDOR", updatedAt: new Date() })
    .where(eq(equiUnits.id, params.equiId));

  const [created] = await db
    .insert(externalServiceCases)
    .values({
      companyId: params.companyId,
      diagnosticId: params.diagnosticId,
      supplierId: params.supplierId,
      vendorDocumentRef: params.vendorDocumentRef?.trim() || null,
      createdByActorUserId: params.actorUserId,
    })
    .returning();

  return created;
}

export async function returnFromExternalVendor(params: {
  caseId: string;
  companyId: string;
  equiId: string;
  actorUserId: string;
}) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(externalServiceCases)
    .where(eq(externalServiceCases.id, params.caseId))
    .limit(1);
  if (!row || row.companyId !== params.companyId) return null;

  await confirmEquiMovement({
    companyId: params.companyId,
    equiId: params.equiId,
    actorUserId: params.actorUserId,
    movementType: "ENTRY",
    motive: "Retorno de proveedor externo",
  });

  const [updated] = await db
    .update(externalServiceCases)
    .set({ status: "RETURNED", updatedAt: new Date() })
    .where(eq(externalServiceCases.id, params.caseId))
    .returning();
  return updated;
}
