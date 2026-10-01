import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { SearchForm } from "@/components/masters/search-form";
import type { CompanySlug } from "@/lib/company";
import { listProspects } from "@/server/masters/prospects";
import { getAuthContext } from "@/server/auth/session";
import {
  canCreateProspect,
  canSeeProspects,
} from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  NUEVO: "Nuevo",
  EN_SEGUIMIENTO: "En seguimiento",
  CONVERTIDO: "Convertido",
  DESCARTADO: "Descartado",
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function ProspectosPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeProspects(auth.effective.role)) redirect("/inicio");

  const { q } = await searchParams;
  const rows = await listProspects({
    companyId: auth.activeCompany.id,
    q,
  });
  const companySlug = auth.activeCompany.slug as CompanySlug;

  return (
    <ListShell
      title="Prospectos"
      description="Pipeline comercial previo a cliente."
      createHref={
        canCreateProspect(auth.effective.role, companySlug)
          ? "/comercial/prospectos/nuevo"
          : undefined
      }
      searchSlot={
        <SearchForm action="/comercial/prospectos" defaultValue={q ?? ""} />
      }
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Responsable</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Fuente</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                No hay prospectos.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <Link
                  href={`/comercial/prospectos/${row.id}`}
                  className="font-medium text-sky-800 hover:underline"
                >
                  {row.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{row.responsibleName}</td>
              <td className="px-4 py-3 text-slate-600">
                {statusLabels[row.status] ?? row.status}
              </td>
              <td className="px-4 py-3 text-slate-600">{row.source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
