import Link from "next/link";
import { redirect } from "next/navigation";
import { EquiCreateForm } from "@/components/assets/asset-forms";
import type { CompanySlug } from "@/lib/company";
import { listEquiBrands, listEquiTypes } from "@/server/assets/equi";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import { canCreateEqui } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

export default async function NuevoEquiPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canCreateEqui(auth.effective.role, slug)) redirect("/activos/equi");

  const [clients, types, brands] = await Promise.all([
    listClients({ companyId: auth.activeCompany.id }),
    listEquiTypes(auth.activeCompany.id),
    listEquiBrands(auth.activeCompany.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/activos/equi" className="text-sm text-sky-800 hover:underline">
        ← EQUI
      </Link>
      <h1 className="text-2xl font-semibold">Nuevo EQUI</h1>
      <EquiCreateForm
        clients={clients.map((c) => ({ id: c.id, legalName: c.legalName }))}
        types={types.map((t) => ({ id: t.id, name: t.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
