import Link from "next/link";
import { redirect } from "next/navigation";
import { HrActionButton } from "@/components/hr/hr-forms";
import { formatPayrollFolio } from "@/server/masters/folios";
import { getPayrollDetail, listPayrollRuns } from "@/server/hr/payroll";
import { getAuthContext } from "@/server/auth/session";
import { canRunPayroll, canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function NominaPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  const runs = await listPayrollRuns(auth.activeCompany.id);
  const latest = runs[0];
  const detail = latest ? await getPayrollDetail(auth.activeCompany.id, latest.id) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nómina semanal</h1>
      {canRunPayroll(auth.effective.role) && (
        <div className="flex gap-2">
          <HrActionButton href="/api/hr/payroll" body={{}} label="Generar borrador semana" />
          {latest?.status === "BORRADOR" && (
            <HrActionButton
              href={`/api/hr/payroll/${latest.id}/authorize`}
              body={{}}
              label="Autorizar nómina"
            />
          )}
        </div>
      )}
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {runs.map((r) => (
          <li key={r.id} className="px-4 py-3">
            {formatPayrollFolio(r.folioNumber)} · {r.weekKey} · {r.status}
          </li>
        ))}
      </ul>
      {detail && (
        <section className="rounded-xl border bg-white p-4 text-sm">
          <h2 className="font-semibold">Líneas {detail.run.folio}</h2>
          <ul className="mt-2 divide-y">
            {detail.lines.map((l) => (
              <li key={l.id} className="flex justify-between py-1">
                <span>{l.concept}</span>
                <span>{l.amountMxn} MXN</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link href="/capital-humano/colaboradores" className="text-sm text-sygos-teal">
        Ver colaboradores
      </Link>
    </div>
  );
}
