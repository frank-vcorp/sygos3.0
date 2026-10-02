import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { getDiagnosticDetail } from "@/server/ops/diagnostics";
import {
  returnFromExternalVendor,
  sendDiagnosticToExternalVendor,
} from "@/server/ops/external-service";
import { canSeeTechnicalOps } from "@/server/rbac/ops";
import { logFunctionalHistory } from "@/server/history/functional";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send"),
    supplierId: z.string().uuid(),
    vendorDocumentRef: z.string().optional(),
  }),
  z.object({
    action: z.literal("return"),
    caseId: z.string().uuid(),
  }),
]);

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeTechnicalOps(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getDiagnosticDetail(id);
  if (!detail?.attention?.equiId) {
    return NextResponse.json({ error: "Sin EQUI." }, { status: 400 });
  }
  try {
    const body = bodySchema.parse(await request.json());
    if (body.action === "send") {
      const row = await sendDiagnosticToExternalVendor({
        companyId: detail.diagnostic.companyId,
        diagnosticId: id,
        supplierId: body.supplierId,
        actorUserId: auth.actor.id,
        equiId: detail.attention.equiId,
        vendorDocumentRef: body.vendorDocumentRef,
      });
      if (!row) {
        return NextResponse.json({ error: "Fallo al enviar." }, { status: 400 });
      }
      await logFunctionalHistory({
        companyId: detail.diagnostic.companyId,
        entityType: "diagnostic",
        entityId: id,
        action: "SERVICIO_EXTERNO_SALIDA",
        detail: body.vendorDocumentRef,
        actorUserId: auth.actor.id,
      });
      return NextResponse.json({ case: row });
    }
    const updated = await returnFromExternalVendor({
      caseId: body.caseId,
      companyId: auth.activeCompany.id,
      equiId: detail.attention.equiId,
      actorUserId: auth.actor.id,
    });
    if (!updated) {
      return NextResponse.json({ error: "Caso no encontrado." }, { status: 404 });
    }
    await logFunctionalHistory({
      companyId: detail.diagnostic.companyId,
      entityType: "diagnostic",
      entityId: id,
      action: "SERVICIO_EXTERNO_RETORNO",
      actorUserId: auth.actor.id,
    });
    return NextResponse.json({ case: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
