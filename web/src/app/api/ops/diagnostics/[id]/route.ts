import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { getDiagnosticDetail, updateDiagnostic } from "@/server/ops/diagnostics";
import {
  canExecuteDiagnostic,
  canSeeTechnicalOps,
  canValidateDiagnostics,
} from "@/server/rbac/ops";
import type { CompanySlug } from "@/lib/company";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeTechnicalOps(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getDiagnosticDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  status: z
    .enum([
      "EN_ESPERA",
      "EN_DIAGNOSTICO",
      "DIAGNOSTICO_TERMINADO",
      "VALIDADO",
      "DEVUELTO_CORRECCION",
    ])
    .optional(),
  assignedUserId: z.string().uuid().optional(),
  technicalResult: z.string().optional(),
  warrantyDecision: z.enum(["GARANTIA_VALIDA", "GARANTIA_NO_PROCEDENTE"]).optional(),
  validationReturnReason: z.string().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth || !canSeeTechnicalOps(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    const detail = await getDiagnosticDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }

    const execCompanyId = detail.diagnostic.companyId;
    if (body.status === "VALIDADO" || body.status === "DEVUELTO_CORRECCION") {
      if (!canValidateDiagnostics(auth.effective.role, slug)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
    } else if (body.status === "EN_DIAGNOSTICO" || body.status === "DIAGNOSTICO_TERMINADO") {
      if (!canExecuteDiagnostic(auth.effective.role, slug)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
    }

    const updated = await updateDiagnostic({
      diagnosticId: id,
      companyId: execCompanyId,
      actorUserId: auth.actor.id,
      actorRole: auth.effective.role,
      patch: body,
    });
    if (!updated) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    if (updated.status === "VALIDADO") {
      const { ensureQuoteFromDiagnostic } = await import(
        "@/server/commercial/quotes"
      );
      await ensureQuoteFromDiagnostic({
        diagnosticId: id,
        actorUserId: auth.actor.id,
      });
    }
    if (body.warrantyDecision === "GARANTIA_NO_PROCEDENTE") {
      const { ensureQuoteFromDiagnostic } = await import(
        "@/server/commercial/quotes"
      );
      await ensureQuoteFromDiagnostic({
        diagnosticId: id,
        actorUserId: auth.actor.id,
      });
    }
    return NextResponse.json({ diagnostic: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
