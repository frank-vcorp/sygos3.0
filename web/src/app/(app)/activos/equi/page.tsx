import Link from "next/link";
import { redirect } from "next/navigation";
import { EquiListTabs } from "@/components/assets/equi-list-tabs";
import { ListShell } from "@/components/masters/list-shell";
import { SearchForm } from "@/components/masters/search-form";
import { equiCustodyLabel } from "@/lib/discovery/labels/assets";
import type { CompanySlug } from "@/lib/company";
import { listEquiUnits } from "@/server/assets/equi";
import { getAuthContext } from "@/server/auth/session";
import { canCreateEqui, canSeeEqui } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; vista?: string }> };

export default async function EquiListPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canSeeEqui(auth.effective.role, slug)) redirect("/inicio");

  const { q, vista } = await searchParams;
  const activeView =
    vista === "pendiente-entrada"
      ? "pendiente-entrada"
      : vista === "resguardo"
        ? "resguardo"
        : "todas";

  const custodyStatus =
    activeView === "pendiente-entrada"
      ? "AWAITING_ENTRY"
      : activeView === "resguardo"
        ? "IN_CUSTODY"
        : undefined;

  const rows = await listEquiUnits({
    companyId: auth.activeCompany.id,
    q,
    custodyStatus,
  });

  const description =
    activeView === "pendiente-entrada"
      ? "Bandeja custodia — equipos sin entrada física confirmada (§5.1)."
      : activeView === "resguardo"
        ? "Equipos en resguardo de almacén SYSTRON."
        : "Identidad física EQUI (§4.1). Folio abre detalle con relaciones técnicas y comerciales.";

  return (
    <div className="space-y-4">
      <EquiListTabs active={activeView} />
      <ListShell
        title="Equipos EQUI"
        description={description}
        createHref={canCreateEqui(auth.effective.role, slug) ? "/activos/equi/nuevo" : undefined}
        createLabel="Nuevo EQUI"
        searchSlot={<SearchForm action="/activos/equi" defaultValue={q ?? ""} />}
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo / Marca / Modelo</th>
              <th className="px-4 py-3">Custodia</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/activos/equi/${r.id}`}
                    className="font-medium text-sygos-teal hover:underline"
                  >
                    {r.folio}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.clientName}</td>
                <td className="px-4 py-3">
                  {r.typeName} · {r.brandName} · {r.model}
                </td>
                <td className="px-4 py-3">
                  {equiCustodyLabel[r.custodyStatus ?? ""] ?? r.custodyStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
    </div>
  );
}
