import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/server/auth/session";
import {
  deleteDirectPurchase,
  getDirectPurchase,
  processDirectPurchase,
  updateDirectPurchase,
} from "@/server/purchases/direct";
import {
  canProcessPurchases,
  canSeePurchasesModule,
} from "@/server/rbac/purchases";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth || !canSeePurchasesModule(auth.effective.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const purchase = await getDirectPurchase(auth.activeCompany.id, id);
  if (!purchase) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  return NextResponse.json({ purchase });
}

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    supplierId: z.string().uuid().optional(),
    concept: z.string().min(2).optional(),
    amountMxn: z.number().int().min(1).optional(),
    paymentTerms: z.enum(["CONTADO", "CREDITO"]).optional(),
  }),
  z.object({
    action: z.literal("process"),
    accountId: z.string().uuid(),
  }),
  z.object({ action: z.literal("delete") }),
]);

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    if (body.action === "update") {
      if (!canProcessPurchases(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const { action: _a, ...fields } = body;
      const purchase = await updateDirectPurchase({
        companyId: auth.activeCompany.id,
        purchaseId: id,
        editorUserId: auth.actor.id,
        ...fields,
      });
      return NextResponse.json({ purchase });
    }
    if (body.action === "process") {
      if (!canProcessPurchases(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      const purchase = await processDirectPurchase({
        companyId: auth.activeCompany.id,
        purchaseId: id,
        processorUserId: auth.actor.id,
        accountId: body.accountId,
      });
      return NextResponse.json({ purchase });
    }
    if (body.action === "delete") {
      if (!canProcessPurchases(auth.effective.role)) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      await deleteDirectPurchase({
        companyId: auth.activeCompany.id,
        purchaseId: id,
      });
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MISSING_SUPPLIER") {
      return NextResponse.json({ error: "Falta proveedor." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo procesar." }, { status: 400 });
  }
  return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
}
