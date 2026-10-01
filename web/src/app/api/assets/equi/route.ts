import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import {
  createEquiUnit,
  ensureEquiBrand,
  ensureEquiType,
  listEquiUnits,
} from "@/server/assets/equi";
import { canCreateEqui, canSeeEqui } from "@/server/rbac/assets";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canSeeEqui(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const custodyStatus = url.searchParams.get("custody") ?? undefined;
  const rows = await listEquiUnits({
    companyId: auth.activeCompany.id,
    q,
    custodyStatus,
  });
  return NextResponse.json({ equi: rows });
}

const postSchema = z.object({
  clientId: z.string().uuid(),
  typeId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  typeName: z.string().optional(),
  brandName: z.string().optional(),
  model: z.string().min(1),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canCreateEqui(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    let typeId = body.typeId;
    let brandId = body.brandId;
    if (!typeId && body.typeName) {
      const t = await ensureEquiType(auth.activeCompany.id, body.typeName);
      typeId = t.id;
    }
    if (!brandId && body.brandName) {
      const b = await ensureEquiBrand(auth.activeCompany.id, body.brandName);
      brandId = b.id;
    }
    if (!typeId || !brandId) {
      return NextResponse.json({ error: "Tipo y marca requeridos." }, { status: 400 });
    }
    const equi = await createEquiUnit({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actor.id,
      clientId: body.clientId,
      typeId,
      brandId,
      model: body.model,
      description: body.description,
      serialNumber: body.serialNumber,
    });
    return NextResponse.json({ equi });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
