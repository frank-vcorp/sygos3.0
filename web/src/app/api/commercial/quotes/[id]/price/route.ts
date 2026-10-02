import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { assignQuotePrice } from "@/server/commercial/quotes";
import { canManageQuotePricing } from "@/server/rbac/commercial";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  subtotalMxn: z.number().int().min(0),
  discountPct: z.number().min(0).max(100).optional(),
  repairBaseMxn: z.number().int().min(0).optional(),
  note: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canManageQuotePricing(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = bodySchema.parse(await request.json());
    const updated = await assignQuotePrice({
      companyId: auth.activeCompany.id,
      quoteId: id,
      actorUserId: auth.actor.id,
      subtotalMxn: body.subtotalMxn,
      discountPct: body.discountPct,
      repairBaseMxn: body.repairBaseMxn,
      note: body.note,
    });
    return NextResponse.json({ quote: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INVALID_STATUS") {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
