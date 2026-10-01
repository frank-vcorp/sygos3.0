import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupplier, updateSupplier } from "@/server/masters/suppliers";
import { getMastersSession } from "@/server/masters/auth";
import {
  canManageSuppliers,
  canSeeSuppliers,
} from "@/server/rbac/masters";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (!auth || !canSeeSuppliers(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const supplier = await getSupplier({
    companyId: auth.activeCompany.id,
    supplierId: id,
  });
  if (!supplier) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json({ supplier });
}

const patchSchema = z.object({
  legalName: z.string().min(1).optional(),
  contactName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  creditDays: z.number().int().min(0).nullable().optional(),
  emitsFiscalInvoice: z.boolean().optional(),
  category: z.string().nullable().optional(),
  taxRfc: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (!auth || !canManageSuppliers(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    const updated = await updateSupplier({
      companyId: auth.activeCompany.id,
      supplierId: id,
      patch: body,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "No encontrado o acción no permitida." },
        { status: 404 },
      );
    }
    return NextResponse.json({ supplier: updated });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
