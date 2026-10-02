import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { createServomotoresBaseQuoteForMotor } from "@/server/commercial/intercompany";
import { canManageQuotePricing } from "@/server/rbac/commercial";

const bodySchema = z.object({
  motorId: z.string().uuid(),
  vendorUserId: z.string().uuid().optional(),
  lines: z
    .array(z.object({ concept: z.string().min(1), quantity: z.number().int().min(1) }))
    .min(1),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || slug !== "SERVOMOTORES" || !canManageQuotePricing(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = bodySchema.parse(await request.json());
    const quote = await createServomotoresBaseQuoteForMotor({
      motorId: body.motorId,
      actorUserId: auth.actor.id,
      vendorUserId: body.vendorUserId ?? auth.effective.id,
      lines: body.lines,
    });
    if (!quote) {
      return NextResponse.json({ error: "MOT no elegible." }, { status: 400 });
    }
    return NextResponse.json({ quote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
