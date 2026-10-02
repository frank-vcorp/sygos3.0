import Link from "next/link";
import { redirect } from "next/navigation";
import { PurchaseOrderForm } from "@/components/purchases/purchase-forms";
import { listSuppliers } from "@/server/masters/suppliers";
import { getAuthContext } from "@/server/auth/session";
import { canManagePurchaseOrders } from "@/server/rbac/purchases";

export const dynamic = "force-dynamic";

export default async function NuevaOcPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManagePurchaseOrders(auth.effective.role)) redirect("/operacion/oc");

  const suppliers = await listSuppliers({ companyId: auth.activeCompany.id });

  return (
    <div className="space-y-4">
      <Link href="/operacion/oc" className="text-sm text-sygos-teal">
        ← O.C.
      </Link>
      <h1 className="text-xl font-semibold">Nueva orden de compra</h1>
      <PurchaseOrderForm
        suppliers={suppliers.map((s) => ({ id: s.id, legalName: s.legalName }))}
      />
    </div>
  );
}
