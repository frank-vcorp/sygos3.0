import Link from "next/link";
import { redirect } from "next/navigation";
import { DirectPurchaseForm } from "@/components/purchases/purchase-forms";
import { listSuppliers } from "@/server/masters/suppliers";
import { getAuthContext } from "@/server/auth/session";
import { canRegisterDirectPurchase } from "@/server/rbac/purchases";

export const dynamic = "force-dynamic";

export default async function NuevaCompraDirectaPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canRegisterDirectPurchase(auth.effective.role)) redirect("/operacion/compras");

  const suppliers = await listSuppliers({ companyId: auth.activeCompany.id });

  return (
    <div className="space-y-4">
      <Link href="/operacion/compras" className="text-sm text-sygos-teal">
        ← Compras directas
      </Link>
      <h1 className="text-xl font-semibold">Registrar compra directa</h1>
      <DirectPurchaseForm
        suppliers={suppliers.map((s) => ({ id: s.id, legalName: s.legalName }))}
      />
    </div>
  );
}
