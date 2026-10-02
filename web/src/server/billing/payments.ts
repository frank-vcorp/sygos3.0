import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  accountsPayable,
  accountsReceivable,
  clients,
  paymentAllocations,
  payments,
} from "@/db/schema";
import {
  applyPaymentToPayable,
  applyPaymentToReceivable,
} from "@/server/billing/ar-ap";
import { formatPaymentFolio, nextFolioValue } from "@/server/masters/folios";

const CASH_INVOICE_LIMIT_MXN = 2000;

export async function listPayments(companyId: string) {
  const db = getDb();
  const rows = await db
    .select({
      payment: payments,
      clientName: clients.legalName,
    })
    .from(payments)
    .leftJoin(clients, eq(clients.id, payments.clientId))
    .where(eq(payments.companyId, companyId))
    .orderBy(desc(payments.createdAt));

  return rows.map((r) => ({
    ...r.payment,
    folio: formatPaymentFolio(r.payment.folioNumber),
    clientName: r.clientName,
  }));
}

export async function registerPayment(params: {
  companyId: string;
  actorUserId: string;
  clientId?: string;
  supplierId?: string;
  isIntercompany?: boolean;
  amountMxn: number;
  destination: (typeof payments.$inferSelect)["destination"];
  receiptReference: string;
  receivedByVendorUserId?: string;
  allocations: { arEntryId?: string; apEntryId?: string; amountMxn: number }[];
}) {
  const db = getDb();
  const folioNumber = await nextFolioValue(params.companyId, "PAG");
  const [payment] = await db
    .insert(payments)
    .values({
      companyId: params.companyId,
      folioNumber,
      clientId: params.clientId ?? null,
      supplierId: params.supplierId ?? null,
      isIntercompany: params.isIntercompany ?? false,
      amountMxn: params.amountMxn,
      destination: params.destination,
      receiptReference: params.receiptReference.trim(),
      receivedByVendorUserId: params.receivedByVendorUserId ?? null,
      createdByActorUserId: params.actorUserId,
      status:
        params.receivedByVendorUserId && params.destination === "EFECTIVO" ?
          "PENDIENTE_VALIDACION"
        : "PENDIENTE_VALIDACION",
    })
    .returning();

  if (params.allocations.length) {
    await db.insert(paymentAllocations).values(
      params.allocations.map((a) => ({
        paymentId: payment.id,
        arEntryId: a.arEntryId ?? null,
        apEntryId: a.apEntryId ?? null,
        amountMxn: a.amountMxn,
      })),
    );
  }

  return { ...payment, folio: formatPaymentFolio(folioNumber) };
}

async function validateCashPolicy(params: {
  destination: (typeof payments.$inferSelect)["destination"];
  amountMxn: number;
  arEntryIds: string[];
}) {
  if (params.destination !== "EFECTIVO") return;
  if (params.amountMxn >= CASH_INVOICE_LIMIT_MXN) {
    throw new Error("CASH_LIMIT");
  }
  const db = getDb();
  for (const arId of params.arEntryIds) {
    const [ar] = await db
      .select({ clientId: accountsReceivable.clientId })
      .from(accountsReceivable)
      .where(eq(accountsReceivable.id, arId))
      .limit(1);
    if (!ar) continue;
    const [client] = await db
      .select({ requiresInvoice: clients.requiresInvoice })
      .from(clients)
      .where(eq(clients.id, ar.clientId))
      .limit(1);
    if (client?.requiresInvoice && params.amountMxn >= CASH_INVOICE_LIMIT_MXN) {
      throw new Error("CASH_LIMIT");
    }
  }
}

export async function validatePayment(params: {
  companyId: string;
  paymentId: string;
  validatorUserId: string;
}) {
  const db = getDb();
  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(eq(payments.id, params.paymentId), eq(payments.companyId, params.companyId)),
    )
    .limit(1);
  if (!payment || payment.status !== "PENDIENTE_VALIDACION") {
    throw new Error("INVALID_STATUS");
  }

  const allocations = await db
    .select()
    .from(paymentAllocations)
    .where(eq(paymentAllocations.paymentId, payment.id));

  await validateCashPolicy({
    destination: payment.destination,
    amountMxn: payment.amountMxn,
    arEntryIds: allocations.map((a) => a.arEntryId).filter(Boolean) as string[],
  });

  for (const alloc of allocations) {
    if (alloc.arEntryId) {
      await applyPaymentToReceivable({
        arEntryId: alloc.arEntryId,
        amountMxn: alloc.amountMxn,
      });
    }
    if (alloc.apEntryId) {
      await applyPaymentToPayable({
        apEntryId: alloc.apEntryId,
        amountMxn: alloc.amountMxn,
      });
    }
  }

  if (payment.isIntercompany && payment.linkedMirrorPaymentId) {
    const mirrorId = payment.linkedMirrorPaymentId;
    const primary = allocations[0];
    if (primary?.apEntryId) {
      const mirrorAllocs = await db
        .select()
        .from(paymentAllocations)
        .where(eq(paymentAllocations.paymentId, mirrorId));
      for (const ma of mirrorAllocs) {
        if (ma.arEntryId) {
          await applyPaymentToReceivable({
            arEntryId: ma.arEntryId,
            amountMxn: ma.amountMxn,
          });
        }
      }
    } else if (primary?.arEntryId) {
      const [ar] = await db
        .select()
        .from(accountsReceivable)
        .where(eq(accountsReceivable.id, primary.arEntryId))
        .limit(1);
      if (ar?.linkedApEntryId) {
        await applyPaymentToPayable({
          apEntryId: ar.linkedApEntryId,
          amountMxn: primary.amountMxn,
        });
      }
    }
    await db
      .update(payments)
      .set({
        status: "VALIDADO",
        validatedByUserId: params.validatorUserId,
        validatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, mirrorId));
  }

  const [updated] = await db
    .update(payments)
    .set({
      status: "VALIDADO",
      validatedByUserId: params.validatorUserId,
      validatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))
    .returning();

  return updated;
}

export async function registerIntercompanyPayment(params: {
  systronCompanyId: string;
  servomotoresCompanyId: string;
  actorUserId: string;
  supplierId: string;
  apEntryId: string;
  linkedArEntryId: string;
  amountMxn: number;
  destination: (typeof payments.$inferSelect)["destination"];
  receiptReference: string;
}) {
  const db = getDb();
  const [arRow] = await db
    .select({ clientId: accountsReceivable.clientId })
    .from(accountsReceivable)
    .where(eq(accountsReceivable.id, params.linkedArEntryId))
    .limit(1);
  if (!arRow) throw new Error("AR_NOT_FOUND");

  const smPayment = await registerPayment({
    companyId: params.servomotoresCompanyId,
    actorUserId: params.actorUserId,
    clientId: arRow.clientId,
    amountMxn: params.amountMxn,
    destination: params.destination,
    receiptReference: params.receiptReference,
    isIntercompany: true,
    allocations: [{ arEntryId: params.linkedArEntryId, amountMxn: params.amountMxn }],
  });

  const syPayment = await registerPayment({
    companyId: params.systronCompanyId,
    actorUserId: params.actorUserId,
    supplierId: params.supplierId,
    amountMxn: params.amountMxn,
    destination: params.destination,
    receiptReference: params.receiptReference,
    isIntercompany: true,
    allocations: [{ apEntryId: params.apEntryId, amountMxn: params.amountMxn }],
  });

  await db
    .update(payments)
    .set({ linkedMirrorPaymentId: syPayment.id, updatedAt: new Date() })
    .where(eq(payments.id, smPayment.id));
  await db
    .update(payments)
    .set({ linkedMirrorPaymentId: smPayment.id, updatedAt: new Date() })
    .where(eq(payments.id, syPayment.id));

  return { servomotoresPayment: smPayment, systronPayment: syPayment };
}
