import Link from "next/link";
import { redirect } from "next/navigation";
import { AttentionCreateForm } from "@/components/ops/ops-forms";
import type { CompanySlug } from "@/lib/company";
import { listEquiUnits } from "@/server/assets/equi";
import { resolveCompanyIds } from "@/server/assets/context";
import { listMotors } from "@/server/assets/motors";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import { canCreateAttention } from "@/server/rbac/ops";

export const dynamic = "force-dynamic";

export default async function NuevaAtencionPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canCreateAttention(auth.effective.role, slug)) redirect("/operacion/tecnica");

  const ids = await resolveCompanyIds();
  const [clients, equi, motors] = await Promise.all([
    listClients({ companyId: auth.activeCompany.id }),
    slug === "SYSTRON"
      ? listEquiUnits({ companyId: auth.activeCompany.id })
      : Promise.resolve([]),
    listMotors({
      activeSlug: slug,
      systronCompanyId: ids.systronId,
      servomotoresCompanyId: ids.servomotoresId,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/operacion/tecnica" className="text-sm text-sky-800 hover:underline">
        ← Operación técnica
      </Link>
      <h1 className="text-2xl font-semibold">Nueva atención</h1>
      <AttentionCreateForm
        clients={clients.map((c) => ({ id: c.id, legalName: c.legalName }))}
        equiOptions={equi.map((e) => ({
          id: e.id,
          label: `${e.folio} · ${e.model}`,
        }))}
        motorOptions={motors.map((m) => ({
          id: m.id,
          label: `${m.folio} · ${m.identification}`,
        }))}
      />
    </div>
  );
}
