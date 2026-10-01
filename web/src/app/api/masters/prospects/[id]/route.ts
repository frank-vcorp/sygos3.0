import { NextResponse } from "next/server";
import { z } from "zod";
import { getProspectDetail, updateProspect } from "@/server/masters/prospects";
import { getMastersSession } from "@/server/masters/auth";
import { canSeeProspects } from "@/server/rbac/masters";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (!auth || !canSeeProspects(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getProspectDetail({
    companyId: auth.activeCompany.id,
    prospectId: id,
  });
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  responsibleUserId: z.string().uuid().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z
    .enum(["NUEVO", "EN_SEGUIMIENTO", "CONVERTIDO", "DESCARTADO"])
    .optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (!auth || !canSeeProspects(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    const updated = await updateProspect({
      companyId: auth.activeCompany.id,
      prospectId: id,
      patch: body,
    });
    if (!updated) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    return NextResponse.json({ prospect: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
