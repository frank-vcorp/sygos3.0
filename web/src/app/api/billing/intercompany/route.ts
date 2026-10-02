import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { createIntercompanyInvoice } from "@/server/billing/fiscal-documents";
import { canEmitFiscalDocument } from "@/server/rbac/billing";

const bodySchema = z.object({
  motorId: z.string().uuid(),
  subtotalMxn: z.number().int().min(0),
  lines: z
    .array(
      z.object({
        concept: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPriceMxn: z.number().int().min(0),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || slug !== "SERVOMOTORES" || !canEmitFiscalDocument(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = bodySchema.parse(await request.json());
    const doc = await createIntercompanyInvoice({
      actorUserId: auth.actor.id,
      motorId: body.motorId,
      subtotalMxn: body.subtotalMxn,
      lines: body.lines,
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
