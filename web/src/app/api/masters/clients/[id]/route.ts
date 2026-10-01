import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientDetail, updateClient } from "@/server/masters/clients";
import { getMastersSession } from "@/server/masters/auth";
import {
  canReassignClientResponsible,
  canSeeClients,
} from "@/server/rbac/masters";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (!auth || !canSeeClients(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const detail = await getClientDetail({
    companyId: auth.activeCompany.id,
    clientId: id,
  });
  if (!detail) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  legalName: z.string().min(1).optional(),
  classification: z.enum(["NORMAL", "PREMIUM"]).nullable().optional(),
  requiresInvoice: z.boolean().optional(),
  creditDays: z.number().int().min(0).nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  taxLegalName: z.string().nullable().optional(),
  taxRfc: z.string().nullable().optional(),
  taxRegime: z.string().nullable().optional(),
  taxZip: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  commercialResponsibleUserId: z.string().uuid().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (!auth || !canSeeClients(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    if (
      body.commercialResponsibleUserId &&
      !canReassignClientResponsible(auth.effectiveRole)
    ) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    const updated = await updateClient({
      companyId: auth.activeCompany.id,
      clientId: id,
      patch: body,
    });
    if (!updated) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    return NextResponse.json({ client: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
