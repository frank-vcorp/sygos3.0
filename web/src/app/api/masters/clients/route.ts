import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, listClients } from "@/server/masters/clients";
import { getMastersSession } from "@/server/masters/auth";
import {
  canCreateClient,
  canSeeClients,
} from "@/server/rbac/masters";

export async function GET(request: Request) {
  const auth = await getMastersSession();
  if (!auth || !canSeeClients(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const rows = await listClients({
    companyId: auth.activeCompany.id,
    q,
  });
  return NextResponse.json({ clients: rows });
}

const postSchema = z.object({
  legalName: z.string().min(1),
  classification: z.enum(["NORMAL", "PREMIUM"]).optional().nullable(),
  requiresInvoice: z.boolean(),
  creditDays: z.number().int().min(0).optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  taxLegalName: z.string().optional().nullable(),
  taxRfc: z.string().optional().nullable(),
  taxRegime: z.string().optional().nullable(),
  taxZip: z.string().optional().nullable(),
  commercialResponsibleUserId: z.string().uuid().optional(),
  primaryContact: z
    .object({
      name: z.string().min(1),
      phone: z.string().optional(),
      jobTitle: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const auth = await getMastersSession();
  if (
    !auth ||
    !canCreateClient(auth.effectiveRole, auth.companySlug)
  ) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const client = await createClient({
      companyId: auth.activeCompany.id,
      companySlug: auth.companySlug,
      actorUserId: auth.actorUserId,
      creatorRole: auth.effectiveRole,
      ...body,
    });
    return NextResponse.json({ client });
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("unique")
        ? "Ya existe un cliente con esa razón social en esta empresa."
        : "Solicitud inválida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
