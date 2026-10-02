import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { appendBitacora, listBitacora } from "@/server/ops/bitacora";
import { getDiagnosticDetail } from "@/server/ops/diagnostics";
import { canExecuteDiagnostic, canSeeTechnicalOps } from "@/server/rbac/ops";
import type { CompanySlug } from "@/lib/company";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeTechnicalOps(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const entries = await listBitacora({ diagnosticId: id });
  return NextResponse.json({ entries });
}

const postSchema = z.object({ body: z.string().min(1) });

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canExecuteDiagnostic(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getDiagnosticDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  if (detail.diagnostic.companyId !== auth.activeCompany.id && slug !== "SERVOMOTORES") {
    return NextResponse.json({ error: "Solo lectura en SYSTRON." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const entry = await appendBitacora({
      companyId: detail.diagnostic.companyId,
      authorUserId: auth.actor.id,
      diagnosticId: id,
      body: body.body,
    });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
