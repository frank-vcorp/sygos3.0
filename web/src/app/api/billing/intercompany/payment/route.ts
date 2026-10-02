import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { resolveCompanyIds } from "@/server/assets/context";
import { getAuthContext } from "@/server/auth/session";
import { registerIntercompanyPayment } from "@/server/billing/payments";
import { canRegisterPayments } from "@/server/rbac/billing";

const bodySchema = z.object({
  apEntryId: z.string().uuid(),
  linkedArEntryId: z.string().uuid(),
  supplierId: z.string().uuid(),
  amountMxn: z.number().int().min(1),
  destination: z.enum(["BANCO", "EFECTIVO", "TARJETA"]),
  receiptReference: z.string().min(3),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || slug !== "SYSTRON" || !canRegisterPayments(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = bodySchema.parse(await request.json());
    const ids = await resolveCompanyIds();
    const result = await registerIntercompanyPayment({
      systronCompanyId: ids.systronId,
      servomotoresCompanyId: ids.servomotoresId,
      actorUserId: auth.actor.id,
      supplierId: body.supplierId,
      apEntryId: body.apEntryId,
      linkedArEntryId: body.linkedArEntryId,
      amountMxn: body.amountMxn,
      destination: body.destination,
      receiptReference: body.receiptReference,
    });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
