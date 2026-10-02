import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  authorizePurchaseOrder,
  cancelPurchaseOrder,
  getPurchaseOrder,
  processPurchaseOrder,
  rejectPurchaseOrder,
  requestReauthorization,
} from "@/server/purchases/orders";
import {
  canAuthorizePurchaseOrder,
  canProcessPurchases,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("authorize") }),
  z.object({ action: z.literal("reject"), reason: z.string().min(3) }),
  z.object({ action: z.literal("cancel"), reason: z.string().min(3) }),
  z.object({
    action: z.literal("reauthorize"),
    authorizedAmountMxn: z.number().int().min(1).optional(),
    supplierId: z.string().uuid().optional(),
    concept: z.string().min(2).optional(),
  }),
  z.object({
    action: z.literal("process"),
    accountId: z.string().uuid(),
    actualAmountMxn: z.number().int().min(1),
  }),
]);

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeePurchasesModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    if (body.action === "authorize") {
      if (!canAuthorizePurchaseOrder(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const order = await authorizePurchaseOrder({
        companyId: auth.activeCompany.id,
        orderId: id,
        approverUserId: auth.actor.id,
      });
      return NextResponse.json({ order });
    }
    if (body.action === "reject") {
      if (!canAuthorizePurchaseOrder(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const order = await rejectPurchaseOrder({
        companyId: auth.activeCompany.id,
        orderId: id,
        reason: body.reason,
      });
      return NextResponse.json({ order });
    }
    if (body.action === "cancel") {
      if (!canProcessPurchases(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const order = await cancelPurchaseOrder({
        companyId: auth.activeCompany.id,
        orderId: id,
        reason: body.reason,
      });
      return NextResponse.json({ order });
    }
    if (body.action === "reauthorize") {
      if (!canProcessPurchases(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const order = await requestReauthorization({
        companyId: auth.activeCompany.id,
        orderId: id,
        authorizedAmountMxn: body.authorizedAmountMxn,
        supplierId: body.supplierId,
        concept: body.concept,
      });
      return NextResponse.json({ order });
    }
    if (body.action === "process") {
      if (!canProcessPurchases(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const order = await processPurchaseOrder({
        companyId: auth.activeCompany.id,
        orderId: id,
        processorUserId: auth.actor.id,
        accountId: body.accountId,
        actualAmountMxn: body.actualAmountMxn,
      });
      return NextResponse.json({ order });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MISSING_SUPPLIER") {
      return NextResponse.json({ error: "Falta proveedor." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo procesar." }, { status: 400 });
  }
  return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
}

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeePurchasesModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const order = await getPurchaseOrder(auth.activeCompany.id, id);
  if (!order) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
