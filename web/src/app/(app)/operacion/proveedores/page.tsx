import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { SearchForm } from "@/components/masters/search-form";
import { listSuppliers } from "@/server/masters/suppliers";
import { getAuthContext } from "@/server/auth/session";
import {
  canManageSuppliers,
  canSeeSuppliers,
} from "@/server/rbac/masters";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function ProveedoresPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeSuppliers(auth.effective.role)) redirect("/inicio");

  const { q } = await searchParams;
  const rows = await listSuppliers({
    companyId: auth.activeCompany.id,
    q,
  });

  return (
    <ListShell
      title="Proveedores"
      description={`Catálogo de proveedores de ${auth.activeCompany.name}.`}
      createHref={
        canManageSuppliers(auth.effective.role)
          ? "/operacion/proveedores/nuevo"
          : undefined
      }
      searchSlot={
        <SearchForm
          action="/operacion/proveedores"
          defaultValue={q ?? ""}
          placeholder="Nombre o RFC…"
        />
      }
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Razón social</th>
            <th className="px-4 py-3 font-medium">Contacto</th>
            <th className="px-4 py-3 font-medium">Factura fiscal</th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                No hay proveedores.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <Link
                  href={`/operacion/proveedores/${row.id}`}
                  className="font-medium text-sky-800 hover:underline"
                >
                  {row.legalName}
                </Link>
                {row.isSystemFixed && (
                  <span className="ml-2 text-xs text-amber-700">Sistema</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {row.contactName ?? "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {row.emitsFiscalInvoice ? "Sí" : "No"}
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
