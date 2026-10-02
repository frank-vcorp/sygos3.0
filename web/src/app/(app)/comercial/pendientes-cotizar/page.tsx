import Link from "next/link";
import { redirect } from "next/navigation";
import { listQuotes } from "@/server/commercial/quotes";
import { getAuthContext } from "@/server/auth/session";
import { canSeePendingPricingQueue } from "@/server/rbac/commercial";

export const dynamic = "force-dynamic";

const originLabel: Record<string, string> = {
  VENDEDOR: "Vendedor",
  DIAGNOSTICO_VALIDADO: "Diagnóstico validado",
  REPARACION_TERMINADA: "Reparación terminada",
  GARANTIA_COBRAR: "Garantía a cobrar",
  MOT_BASE_SERVOMOTORES: "Base MOT Servomotores",
};

export default async function PendientesCotizarPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeePendingPricingQueue(auth.effective.role)) redirect("/inicio");

  const rows = await listQuotes({
    companyId: auth.activeCompany.id,
    pendingPricingOnly: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pendientes de cotizar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bandeja unificada para CEO/Administrador — determinación de precio.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Origen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/comercial/cotizaciones/${q.id}`}
                    className="font-medium text-sygos-teal hover:underline"
                  >
                    {q.folio}
                  </Link>
                </td>
                <td className="px-4 py-3">{q.clientName}</td>
                <td className="px-4 py-3">{q.quoteType.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{originLabel[q.quoteOrigin] ?? q.quoteOrigin}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No hay pendientes de precio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
