import Link from "next/link";
import { redirect } from "next/navigation";
import { HrActionButton } from "@/components/hr/hr-forms";
import { PayrollPanel } from "@/components/hr/payroll-panel";
import { formatPayrollFolio } from "@/server/masters/folios";
import { listEmployees } from "@/server/hr/employees";
import { getPayrollDetail, listPayrollRuns } from "@/server/hr/payroll";
import { getAuthContext } from "@/server/auth/session";
import {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nómina</h1>
      {canRunPayroll(auth.effective.role) && (
        <div className="flex flex-wrap gap-2">
          <HrActionButton href="/api/hr/payroll" body={{ kind: "semanal" }} label="Generar borrador semanal" />
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
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {runs.map((r) => (
          <li key={r.id} className="px-4 py-3">
            {formatPayrollFolio(r.folioNumber)} · {r.weekKey} · {r.runKind} · {r.status} ·{" "}
            fiscal {r.fiscalStatus}
          </li>
        ))}
      </ul>
      {detail && (
        <PayrollPanel
          runId={detail.run.id}
          runStatus={detail.run.status}
          runKind={detail.run.runKind}
          lines={detail.lines.map((l) => ({
            id: l.id,
            concept: l.concept,
            amountMxn: l.amountMxn,
            lineKind: l.lineKind,
            employeeId: l.employeeId,
          }))}
          canAuthorize={canAuthorizePayroll(auth.effective.role)}
          canAdjust={canRunPayroll(auth.effective.role)}
          employees={employees.map((e) => ({
            id: e.employee.id,
            legalName: e.employee.legalName,
          }))}
        />
      )}
      <Link href="/capital-humano/colaboradores" className="text-sm text-sygos-teal">
        Ver colaboradores
      </Link>
      <p className="text-xs text-slate-500">
        Configure montos de bonos en Configuración → General. Timbrado nómina vía Facturapi en iteración siguiente.
      </p>
    </div>
  );
}
