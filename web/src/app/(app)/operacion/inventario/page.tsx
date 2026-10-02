import { redirect } from "next/navigation";
import { InventoryPanel } from "@/components/assets/inventory-panel";
import type { CompanySlug } from "@/lib/company";
import { listInventoryParts } from "@/server/assets/inventory";
import { getCompanySettings } from "@/server/config/company-settings";
import { getAuthContext } from "@/server/auth/session";
import { canManageInventory } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  const settings = await getCompanySettings(auth.activeCompany.id);
  if (
    !canManageInventory(
      auth.effective.role,
      slug,
      settings.servomotoresInventoryEnabled,
    )
  ) {
    redirect("/inicio");
  }

  const parts = await listInventoryParts({ companyId: auth.activeCompany.id });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventario de refacciones</h1>
        <p className="mt-1 text-sm text-slate-600">
          §5.2 — {auth.activeCompany.name} · refacciones · mín/máx informativos · importación con
          previsualización.
        </p>
        {slug === "SERVOMOTORES" && !settings.servomotoresInventoryEnabled && (
          <p className="mt-2 text-sm text-amber-800">Capacidad deshabilitada (solo Admin).</p>
        )}
      </div>
      <InventoryPanel initialParts={parts} />
    </div>
  );
}
