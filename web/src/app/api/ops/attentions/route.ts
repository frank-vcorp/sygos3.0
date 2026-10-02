import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { createServiceAttention, listAttentions } from "@/server/ops/attentions";
import { canCreateAttention, canSeeTechnicalOps } from "@/server/rbac/ops";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeTechnicalOps(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const rows = await listAttentions(auth.activeCompany.id);
  return NextResponse.json({ attentions: rows });
}

const postSchema = z.object({
  clientId: z.string().uuid(),
  equiId: z.string().uuid().optional(),
  motorId: z.string().uuid().optional(),
  attentionType: z.enum(["DIAGNOSTICO", "REPARACION", "DIAGNOSTICO_GARANTIA"]),
  reportedFailure: z.string().min(1),
  priorityCode: z.enum(["NORMAL", "ALTA", "EXPRESS"]),
  warrantySourceWorkOrderId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canCreateAttention(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const result = await createServiceAttention({
      activeSlug: slug,
      activeCompanyId: auth.activeCompany.id,
      actorUserId: auth.actor.id,
      ...body,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "ASSET_REQUIRED") {
      return NextResponse.json({ error: "Indica EQUI o MOT." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear la atención." }, { status: 400 });
  }
}
