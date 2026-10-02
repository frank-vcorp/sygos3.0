import { NextResponse } from "next/server";
import { z } from "zod";
import type { CompanySlug } from "@/lib/company";
import { getAuthContext } from "@/server/auth/session";
import { getDiagnosticDetail } from "@/server/ops/diagnostics";
import {
  returnFromExternalVendor,
  sendDiagnosticToExternalVendor,
} from "@/server/ops/external-service";
import { canManageExternalService } from "@/server/rbac/ops";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  action: z.enum(["send", "return"]),
  supplierId: z.string().uuid().optional(),
  equiId: z.string().uuid(),
  caseId: z.string().uuid().optional(),
  vendorDocumentRef: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canManageExternalService(auth.effective.role, slug)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const detail = await getDiagnosticDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    if (body.action === "send") {
      if (!body.supplierId) {
        return NextResponse.json({ error: "Proveedor requerido." }, { status: 400 });
      }
      const created = await sendDiagnosticToExternalVendor({
        companyId: auth.activeCompany.id,
        diagnosticId: id,
        supplierId: body.supplierId,
        equiId: body.equiId,
        actorUserId: auth.actor.id,
        vendorDocumentRef: body.vendorDocumentRef,
      });
      if (!created) {
        return NextResponse.json({ error: "No se pudo registrar." }, { status: 400 });
      }
      return NextResponse.json({ case: created });
    }
    if (!body.caseId) {
      return NextResponse.json({ error: "caseId requerido." }, { status: 400 });
    }
    const updated = await returnFromExternalVendor({
      caseId: body.caseId,
      companyId: auth.activeCompany.id,
      equiId: body.equiId,
      actorUserId: auth.actor.id,
    });
    if (!updated) {
      return NextResponse.json({ error: "No se pudo registrar retorno." }, { status: 400 });
    }
    return NextResponse.json({ case: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
