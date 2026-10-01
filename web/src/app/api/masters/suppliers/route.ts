import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupplier, listSuppliers } from "@/server/masters/suppliers";
import { getMastersSession } from "@/server/masters/auth";
import {
  canManageSuppliers,
  canSeeSuppliers,
} from "@/server/rbac/masters";

export async function GET(request: Request) {
  const auth = await getMastersSession();
  if (!auth || !canSeeSuppliers(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const rows = await listSuppliers({
    companyId: auth.activeCompany.id,
    q,
  });
  return NextResponse.json({ suppliers: rows });
}

const postSchema = z.object({
  legalName: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  creditDays: z.number().int().min(0).optional().nullable(),
  emitsFiscalInvoice: z.boolean(),
  category: z.string().optional(),
  taxRfc: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await getMastersSession();
  if (!auth || !canManageSuppliers(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  try {
    const body = postSchema.parse(await request.json());
    const supplier = await createSupplier({
      companyId: auth.activeCompany.id,
      actorUserId: auth.actorUserId,
      ...body,
    });
    return NextResponse.json({ supplier });
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida o nombre duplicado." },
      { status: 400 },
    );
  }
}
