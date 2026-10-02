import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { createPurchaseOrder, listPurchaseOrders } from "@/server/purchases/orders";
import {
  canManagePurchaseOrders,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeePurchasesModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const orders = await listPurchaseOrders(auth.activeCompany.id);
  return NextResponse.json({ orders });
}

const postSchema = z.object({
  supplierId: z.string().uuid().optional(),
  concept: z.string().min(2),
  authorizedAmountMxn: z.number().int().min(1),
  paymentTerms: z.enum(["CONTADO", "CREDITO"]),
  destinationKind: z.enum(["WORK_ORDER", "MOTOR", "INVENTORY", "OPERATIONAL"]),
  workOrderId: z.string().uuid().optional(),
  motorId: z.string().uuid().optional(),
  shippingReference: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canManagePurchaseOrders(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const order = await createPurchaseOrder({
      companyId: auth.activeCompany.id,
      requestedByUserId: auth.effective.id,
      creatorRole: auth.effective.role,
      ...body,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
