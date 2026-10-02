import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  approveAndExecuteCancellation,
  approveCreditNoteForEmit,
  emitFiscalDocument,
  getFiscalDocumentDetail,
  prepareCreditNoteFromInvoice,
  requestCancellation,
  retryFiscalEmit,
} from "@/server/billing/fiscal-documents";
import {
  canApproveFiscalCancellation,
  canEmitFiscalDocument,
  canSeeBillingModule,
} from "@/server/rbac/billing";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeBillingModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getFiscalDocumentDetail(auth.activeCompany.id, id);
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("emit") }),
  z.object({ action: z.literal("retry") }),
  z.object({ action: z.literal("request_cancel") }),
  z.object({ action: z.literal("approve_cancel") }),
  z.object({ action: z.literal("prepare_credit_note") }),
  z.object({ action: z.literal("approve_credit_note") }),
]);

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    if (body.action === "emit" || body.action === "retry") {
      if (!canEmitFiscalDocument(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const doc =
        body.action === "retry" ?
          await retryFiscalEmit({
            companyId: auth.activeCompany.id,
            fiscalDocumentId: id,
            actorUserId: auth.actor.id,
          })
        : await emitFiscalDocument({
            companyId: auth.activeCompany.id,
            fiscalDocumentId: id,
            actorUserId: auth.actor.id,
          });
      return NextResponse.json({ document: doc });
    }
    if (body.action === "request_cancel") {
      const doc = await requestCancellation({
        companyId: auth.activeCompany.id,
        fiscalDocumentId: id,
        actorUserId: auth.actor.id,
      });
      return NextResponse.json({ document: doc });
    }
    if (body.action === "approve_cancel") {
      if (!canApproveFiscalCancellation(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const doc = await approveAndExecuteCancellation({
        companyId: auth.activeCompany.id,
        fiscalDocumentId: id,
        approverUserId: auth.actor.id,
        executorUserId: auth.actor.id,
      });
      return NextResponse.json({ document: doc });
    }
    if (body.action === "prepare_credit_note") {
      if (!canEmitFiscalDocument(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const doc = await prepareCreditNoteFromInvoice({
        companyId: auth.activeCompany.id,
        fiscalDocumentId: id,
        actorUserId: auth.actor.id,
      });
      return NextResponse.json({ document: doc });
    }
    if (body.action === "approve_credit_note") {
      if (!canApproveFiscalCancellation(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const doc = await approveCreditNoteForEmit({
        companyId: auth.activeCompany.id,
        fiscalDocumentId: id,
      });
      return NextResponse.json({ document: doc });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MISSING_TAX_DATA") {
      return NextResponse.json({ error: "Faltan datos fiscales del cliente." }, { status: 400 });
    }
    if (msg === "INVALID_STATUS") {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al procesar documento." }, { status: 400 });
  }
  return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
}
