import Link from "next/link";
import { redirect } from "next/navigation";
import { buildGerenteSmPanel } from "@/server/panels/aggregates";
import { getAuthContext } from "@/server/auth/session";
import { canSeeGerenteSmPanel } from "@/server/rbac/panels";

export const dynamic = "force-dynamic";

export default async function PanelGerenteSmPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeGerenteSmPanel(auth.effective.role)) redirect("/inicio");

  const panel = await buildGerenteSmPanel(auth.activeCompany.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel Gerente Operativo Servomotores</h1>
      <section className="rounded-xl border bg-white p-4 text-sm">
        <h2 className="font-semibold">Pendientes de cotizar</h2>
        <ul className="mt-2 divide-y">
          {panel.pendingQuotes.map((q) => (
            <li key={q.id} className="py-2">
              <Link href={`/comercial/cotizaciones/${q.id}`} className="text-sygos-teal">
                {q.folio} · {q.clientName}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
