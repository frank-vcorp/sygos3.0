import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { payrollRunStatusLabel } from "@/lib/discovery/labels/hr";
import { HrActionButton } from "@/components/hr/hr-forms";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { PayrollPanel } from "@/components/hr/payroll-panel";
import { getPayrollRunJourneyHint } from "@/server/journey/hr-handoffs";
import { formatPayrollFolio } from "@/server/masters/folios";
import { listEmployees } from "@/server/hr/employees";
import { getPayrollDetail, listPayrollRuns } from "@/server/hr/payroll";
import { getAuthContext } from "@/server/auth/session";
import {
  canAdjustPayrollExtras,
  canAuthorizePayroll,
  canRunPayroll,
  canSeeHrModule,
} from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

export default async function NominaPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  const [runs, employees] = await Promise.all([
    listPayrollRuns(auth.activeCompany.id),
    listEmployees(auth.activeCompany.id),
  ]);
  const latest = runs[0];
  const detail = latest ? await getPayrollDetail(auth.activeCompany.id, latest.id) : null;
  const payrollHint =
    latest ?
      getPayrollRunJourneyHint({
        status: latest.status,
        fiscalStatus: latest.fiscalStatus,
      })
    : null;

  return (
    <div className="space-y-6">
      {payrollHint && <JourneyPanel title="Qué falta para avanzar" hint={payrollHint} />}
      <ListShell
        title="Nómina"
        description="§9.2 — borrador Coordinación/RH → autorización CEO → timbrado; no reabrir autorizada."
      >
        {canRunPayroll(auth.effective.role) && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">
            <HrActionButton
              href="/api/hr/payroll"
              body={{ kind: "semanal" }}
              label="Generar borrador semanal"
            />
            <HrActionButton
              href="/api/hr/payroll"
              body={{ kind: "aguinaldo" }}
              label="Generar aguinaldo (año actual)"
            />
            {latest?.status === "BORRADOR" && canAuthorizePayroll(auth.effective.role) && (
              <>
                <HrActionButton
                  href={`/api/hr/payroll/${latest.id}/authorize`}
                  body={{}}
                  label="Autorizar nómina (CEO/Admin)"
                />
                {latest.fiscalStatus === "ERROR" && (
                  <HrActionButton
                    href={`/api/hr/payroll/${latest.id}/retry-stamp`}
                    body={{}}
                    label="Reintentar timbrado"
                  />
                )}
              </>
            )}
            {latest && (
              <Link
                href={`/capital-humano/nomina/${latest.id}/imprimir`}
                className="rounded border px-2 py-1 text-xs text-sygos-teal"
              >
                Imprimir recibo interno
              </Link>
            )}
          </div>
        )}
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Semana</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fiscal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">{formatPayrollFolio(r.folioNumber)}</td>
                <td className="px-4 py-3">{r.weekKey}</td>
                <td className="px-4 py-3">{r.runKind}</td>
                <td className="px-4 py-3">
                  {payrollRunStatusLabel[r.status] ?? r.status}
                </td>
                <td className="px-4 py-3">{r.fiscalStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListShell>
      {detail && (
        <PayrollPanel
          runId={detail.run.id}
          runStatus={detail.run.status}
          runKind={detail.run.runKind}
          lines={detail.lines}
          canAuthorize={canAuthorizePayroll(auth.effective.role)}
          canAdjust={canAdjustPayrollExtras(auth.effective.role)}
          employees={employees.map(({ employee: e }) => ({
            id: e.id,
            legalName: e.legalName,
          }))}
        />
      )}
    </div>
  );
}
