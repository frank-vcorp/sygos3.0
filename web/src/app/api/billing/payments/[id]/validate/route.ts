import { NextResponse } from "next/server";
import { getAuthContext } from "@/server/auth/session";
import { validatePayment } from "@/server/billing/payments";
import { canValidatePayments } from "@/server/rbac/billing";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canValidatePayments(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const payment = await validatePayment({
      companyId: auth.activeCompany.id,
      paymentId: id,
      validatorUserId: auth.actor.id,
    });
    return NextResponse.json({ payment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "CASH_LIMIT") {
      return NextResponse.json(
        { error: "Efectivo no permitido ≥ $2,000 MXN con factura." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "No se pudo validar." }, { status: 400 });
  }
}
