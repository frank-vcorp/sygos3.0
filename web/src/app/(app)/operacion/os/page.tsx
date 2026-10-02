import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { listWorkOrders } from "@/server/assets/work-orders";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps } from "@/server/rbac/ops";

export const dynamic = "force-dynamic";

export default async function OsListPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const rows = await listWorkOrders(auth.activeCompany.id);

  return (
    <ListShell
      title="Órdenes de servicio"
      description="Reparación preautorizada y OS derivadas."
      createHref="/operacion/atenciones/nueva"
      createLabel="Nueva atención reparación"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Folio</th>
            <th className="px-4 py-3">Estado técnico</th>
            <th className="px-4 py-3">Resumen</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">
                <Link href={`/operacion/os/${r.id}`} className="font-medium text-sky-800 hover:underline">
                  {r.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{r.repairStatus}</td>
              <td className="px-4 py-3">{r.summary ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
