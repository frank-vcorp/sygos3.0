import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { SearchForm } from "@/components/masters/search-form";
import type { CompanySlug } from "@/lib/company";
import { listEquiUnits } from "@/server/assets/equi";
import { getAuthContext } from "@/server/auth/session";
import { canCreateEqui, canSeeEqui } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; custody?: string }> };

const custodyLabels: Record<string, string> = {
  AWAITING_ENTRY: "Pendiente entrada",
  IN_CUSTODY: "En resguardo",
  OUT: "Fuera",
  TRIAL_OUT: "Salida a prueba",
};

export default async function EquiListPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canSeeEqui(auth.effective.role, slug)) redirect("/inicio");

  const { q, custody } = await searchParams;
  const rows = await listEquiUnits({
    companyId: auth.activeCompany.id,
    q,
    custodyStatus: custody,
  });

  return (
    <ListShell
      title="Equipos EQUI"
      description="Identidad física SYSTRON. Folio EQUI consecutivo por empresa."
      createHref={canCreateEqui(auth.effective.role, slug) ? "/activos/equi/nuevo" : undefined}
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
                <Link href={`/activos/equi/${r.id}`} className="font-medium text-sky-800 hover:underline">
                  {r.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{r.clientName}</td>
              <td className="px-4 py-3">
                {r.typeName} · {r.brandName} · {r.model}
              </td>
              <td className="px-4 py-3">{custodyLabels[r.custodyStatus] ?? r.custodyStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
