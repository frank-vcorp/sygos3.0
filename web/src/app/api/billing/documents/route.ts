import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  createFreeInvoice,
  listFiscalDocuments,
  requestDocumentFromQuote,
} from "@/server/billing/fiscal-documents";
import {
  canEmitFiscalDocument,
  canRequestFiscalDocument,
  canSeeBillingModule,
} from "@/server/rbac/billing";
import type { CompanySlug } from "@/lib/company";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth || !canSeeBillingModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const pending = new URL(request.url).searchParams.get("pending") === "1";
  const docs = await listFiscalDocuments({
    companyId: auth.activeCompany.id,
    pendingOnly: pending,
  });
  return NextResponse.json({ documents: docs });
}

const postSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("quote_request"),
    quoteId: z.string().uuid(),
    docKind: z.enum(["FACTURA", "REMISION"]),
    amountMxn: z.number().int().min(0).optional(),
  }),
  z.object({
    kind: z.literal("free"),
    clientId: z.string().uuid(),
    lines: z
      .array(
        z.object({
          concept: z.string().min(1),
          quantity: z.number().int().min(1),
          unitPriceMxn: z.number().int().min(0),
        }),
      )
      .min(1),
    discountMxn: z.number().int().min(0).optional(),
  }),
]);

export async function POST(request: Request) {
  const auth = await getAuthContext();
  const slug = auth?.activeCompany.slug as CompanySlug;
  if (!auth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    if (body.kind === "quote_request") {
      if (!canRequestFiscalDocument(auth.effective.role, slug)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const doc = await requestDocumentFromQuote({
        companyId: auth.activeCompany.id,
        quoteId: body.quoteId,
        actorUserId: auth.actor.id,
        docKind: body.docKind,
        amountMxn: body.amountMxn,
      });
      return NextResponse.json({ document: doc }, { status: 201 });
    }
    if (!canEmitFiscalDocument(auth.effective.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    const doc = await createFreeInvoice({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actor.id,
      clientId: body.clientId,
      lines: body.lines,
      discountMxn: body.discountMxn,
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "OVER_INVOICE") {
      return NextResponse.json({ error: "Excede saldo facturable." }, { status: 400 });
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
