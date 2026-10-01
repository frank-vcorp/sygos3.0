import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { SearchForm } from "@/components/masters/search-form";
import type { CompanySlug } from "@/lib/company";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import {
  canCreateClient,
  canSeeClients,
} from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function ClientesPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeClients(auth.effective.role)) redirect("/inicio");

  const { q } = await searchParams;
  const rows = await listClients({
    companyId: auth.activeCompany.id,
    q,
  });
  const companySlug = auth.activeCompany.slug as CompanySlug;
  const canCreate = canCreateClient(auth.effective.role, companySlug);

  return (
    <ListShell
      title="Clientes"
      description={`Catálogo comercial de ${auth.activeCompany.name}. Unicidad exacta por razón social.`}
      createHref={canCreate ? "/comercial/clientes/nuevo" : undefined}
      searchSlot={
        <SearchForm
          action="/comercial/clientes"
          defaultValue={q ?? ""}
          placeholder="Razón social o RFC…"
        />
      }
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Razón social</th>
            <th className="px-4 py-3 font-medium">Responsable</th>
            <th className="px-4 py-3 font-medium">Factura</th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                No hay clientes registrados.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <Link
                  href={`/comercial/clientes/${row.id}`}
                  className="font-medium text-sky-800 hover:underline"
                >
                  {row.legalName}
                </Link>
                {row.classification && (
                  <span className="ml-2 text-xs text-slate-400">
                    {row.classification}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{row.responsibleName}</td>
              <td className="px-4 py-3 text-slate-600">
                {row.requiresInvoice ? "Sí" : "No"}
              </td>
              <td className="px-4 py-3">
                {row.isActive ? (
                  <span className="text-emerald-700">Activo</span>
                ) : (
                  <span className="text-slate-400">Inactivo</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
