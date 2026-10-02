import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { listProductionEntries, recordProductionEntry } from "@/server/ops/production";
import { canSeeProduction } from "@/server/rbac/panels";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !canSeeProduction(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const entries = await listProductionEntries(auth.activeCompany.id);
  return NextResponse.json({ entries });
}

const postSchema = z.object({
  workOrderId: z.string().uuid(),
  hoursTenths: z.number().int().min(1),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeProduction(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const entry = await recordProductionEntry({
      companyId: auth.activeCompany.id,
      workOrderId: body.workOrderId,
      technicianUserId: auth.effective.id,
      hoursTenths: body.hoursTenths,
      note: body.note,
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
