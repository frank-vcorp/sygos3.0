import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import { regularizePendingVerification } from "@/server/finance/movements";
import { canSeeFinanceModule } from "@/server/rbac/finance";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  fiscalDocumentId: z.string().uuid(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeeFinanceModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = bodySchema.parse(await request.json());
    const movement = await regularizePendingVerification({
      companyId: auth.activeCompany.id,
      movementId: id,
      fiscalDocumentId: body.fiscalDocumentId,
    });
    return NextResponse.json({ movement });
  } catch {
    return NextResponse.json({ error: "No se pudo regularizar." }, { status: 400 });
  }
}
