import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SupplierDetailPanel } from "@/components/masters/supplier-forms";
import { getSupplier } from "@/server/masters/suppliers";
import { getAuthContext } from "@/server/auth/session";
import {
  canManageSuppliers,
  canSeeSuppliers,
} from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ProveedorDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeSuppliers(auth.effective.role)) redirect("/inicio");
  if (!canManageSuppliers(auth.effective.role)) {
    redirect("/operacion/proveedores");
  }

  const { id } = await params;
  const supplier = await getSupplier({
    companyId: auth.activeCompany.id,
    supplierId: id,
  });
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/operacion/proveedores"
        className="text-sm text-sky-800 hover:underline"
      >
        ← Proveedores
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">
        {supplier.legalName}
      </h1>
      <SupplierDetailPanel supplier={supplier} />
    </div>
  );
}
