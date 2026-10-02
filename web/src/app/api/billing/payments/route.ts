import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { listPayments, registerPayment } from "@/server/billing/payments";
import { canRegisterPayments, canSeeBillingModule } from "@/server/rbac/billing";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeBillingModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const payments = await listPayments(auth.activeCompany.id);
  return NextResponse.json({ payments });
}

const postSchema = z.object({
  clientId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  amountMxn: z.number().int().min(1),
  destination: z.enum(["BANCO", "EFECTIVO", "TARJETA"]),
  receiptReference: z.string().min(3),
  receivedByVendor: z.boolean().optional(),
  allocations: z
    .array(
      z.object({
        arEntryId: z.string().uuid().optional(),
        apEntryId: z.string().uuid().optional(),
        amountMxn: z.number().int().min(1),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canRegisterPayments(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const payment = await registerPayment({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actor.id,
      clientId: body.clientId,
      supplierId: body.supplierId,
      amountMxn: body.amountMxn,
      destination: body.destination,
      receiptReference: body.receiptReference,
      receivedByVendorUserId:
        body.receivedByVendor ? auth.effective.id : undefined,
      allocations: body.allocations,
    });
    return NextResponse.json({ payment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
