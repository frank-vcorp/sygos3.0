import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DetailSection } from "@/components/discovery/detail-section";
import { employeeStatusLabel } from "@/lib/discovery/labels/hr";
import { getEmployee } from "@/server/hr/employees";
import { getAuthContext } from "@/server/auth/session";
import { canSeeHrModule } from "@/server/rbac/hr";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ColaboradorDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeHrModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const employee = await getEmployee(auth.activeCompany.id, id);
  if (!employee) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/capital-humano/colaboradores" className="text-sm text-sygos-teal">
        ← Colaboradores
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{employee.legalName}</h1>
        <p className="text-sm text-slate-500">
          {employeeStatusLabel[employee.status] ?? employee.status} · Ingreso{" "}
          {employee.hireDate.toLocaleDateString("es-MX")}
        </p>
      </div>
      <DetailSection title="Información laboral">
        <p>
          <span className="text-slate-500">Tipo alta:</span> {employee.hireType}
        </p>
        <p>
          <span className="text-slate-500">Saldo vacaciones:</span>{" "}
          {employee.vacationBalanceDays} días
        </p>
        <p>
          <span className="text-slate-500">Kiosco:</span>{" "}
          {employee.kioskEnabled ? "Habilitado" : "No aplica"}
        </p>
      </DetailSection>
      <DetailSection title="Relaciones RH" description="Navegación a procesos del colaborador.">
        <div className="flex flex-wrap gap-4 text-sygos-teal">
          <Link href="/capital-humano/vacaciones">Vacaciones</Link>
          <Link href="/capital-humano/nomina">Nóminas</Link>
          <Link href="/capital-humano/mis-horas-extra">Horas extra</Link>
        </div>
      </DetailSection>
    </div>
  );
}
