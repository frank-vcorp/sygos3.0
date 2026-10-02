import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  listDirectPurchases,
  registerDirectPurchase,
} from "@/server/purchases/direct";
import {
  canRegisterDirectPurchase,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeePurchasesModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const rows = await listDirectPurchases(auth.activeCompany.id);
  return NextResponse.json({ purchases: rows });
}

const postSchema = z.object({
  supplierId: z.string().uuid().optional(),
  concept: z.string().min(2),
  amountMxn: z.number().int().min(1),
  paymentTerms: z.enum(["CONTADO", "CREDITO"]),
  destinationKind: z.enum(["WORK_ORDER", "MOTOR", "INVENTORY", "OPERATIONAL"]),
  workOrderId: z.string().uuid().optional(),
  motorId: z.string().uuid().optional(),
  shippingReference: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canRegisterDirectPurchase(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const purchase = await registerDirectPurchase({
      companyId: auth.activeCompany.id,
      registeredByUserId: auth.effective.id,
      ...body,
    });
    return NextResponse.json({ purchase }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INDIVIDUAL_LIMIT" || msg === "MONTHLY_LIMIT") {
      return NextResponse.json({ error: "Excede límites de compra directa." }, { status: 400 });
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
