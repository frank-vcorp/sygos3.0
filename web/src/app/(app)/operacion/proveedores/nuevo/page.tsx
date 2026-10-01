import Link from "next/link";
import { redirect } from "next/navigation";
import { SupplierCreateForm } from "@/components/masters/supplier-forms";
import { getAuthContext } from "@/server/auth/session";
import { canManageSuppliers } from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

export default async function NuevoProveedorPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageSuppliers(auth.effective.role)) {
    redirect("/operacion/proveedores");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/operacion/proveedores"
        className="text-sm text-sky-800 hover:underline"
      >
        ← Proveedores
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">Nuevo proveedor</h1>
      <SupplierCreateForm />
    </div>
  );
}
