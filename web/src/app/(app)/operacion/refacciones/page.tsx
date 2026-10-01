import Link from "next/link";
import { redirect } from "next/navigation";
import { RefaccionesPanel } from "@/components/assets/refacciones-panel";
import type { CompanySlug } from "@/lib/company";
import { listWorkOrders } from "@/server/assets/work-orders";
import { getAuthContext } from "@/server/auth/session";
import { canManageWorkOrders } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

export default async function RefaccionesPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canManageWorkOrders(auth.effective.role, slug)) redirect("/inicio");

  const workOrders = await listWorkOrders(auth.activeCompany.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Refacciones (OS)</h1>
        <p className="text-sm text-slate-600">
          Solicitudes desde orden de servicio. Estados: Solicitada → En tránsito → En almacén → Surtida.
        </p>
        <Link href="/operacion/inventario" className="text-sm text-sky-800 hover:underline">
          Ir a inventario
        </Link>
      </div>
      <RefaccionesPanel workOrders={workOrders} />
    </div>
  );
}
