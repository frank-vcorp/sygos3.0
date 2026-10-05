import Link from "next/link";
import { redirect } from "next/navigation";
import { UatRecorridosChecklist } from "@/components/discovery/uat-recorridos-checklist";
import { uatRecorridos } from "@/lib/discovery/uat-recorridos";
import { getAuthContext } from "@/server/auth/session";
import { canManageCompanySettings } from "@/server/rbac/users-admin";

export const dynamic = "force-dynamic";

export default async function UatRecorridosPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageCompanySettings(auth.actor.role)) redirect("/inicio");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/configuracion/cierre-e2e" className="text-sm text-sygos-teal">
        ← Checklist E2E
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Recorridos UAT (100 % discovery funcional)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Validación por <strong>journeys</strong>, no por pantallas sueltas. Código y handoffs en{" "}
          <code className="text-xs">web/src/server/journey/*</code> y APIs; el producto pasa cuando
          estos recorridos se ejecutan sin bloqueos de rol/estado. Guion detallado: repo{" "}
          <code className="text-xs">SYGOS_3.0_PLAN_VALIDACION_FINAL.md</code> · usuarios QA:{" "}
          <code className="text-xs">web/docs/STAGING-UAT.md</code>.
        </p>
      </div>
      <UatRecorridosChecklist recorridos={uatRecorridos} />
    </div>
  );
}
