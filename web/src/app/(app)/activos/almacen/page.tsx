import Link from "next/link";
import { redirect } from "next/navigation";
import type { CompanySlug } from "@/lib/company";
import { listEquiUnits } from "@/server/assets/equi";
import { resolveCompanyIds } from "@/server/assets/context";
import { listMotors } from "@/server/assets/motors";
import { getAuthContext } from "@/server/auth/session";
import {
  canOperateServomotoresCustody,
  canOperateSystronWarehouse,
} from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

export default async function AlmacenPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;

  if (slug === "SYSTRON") {
    if (!canOperateSystronWarehouse(auth.effective.role, slug)) redirect("/inicio");
    const [pending, custody] = await Promise.all([
      listEquiUnits({
        companyId: auth.activeCompany.id,
        custodyStatus: "AWAITING_ENTRY",
      }),
      listEquiUnits({
        companyId: auth.activeCompany.id,
        custodyStatus: "IN_CUSTODY",
      }),
    ]);
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl font-semibold">Almacén SYSTRON</h1>
        <p className="text-sm text-slate-600">
          Entradas, resguardo y salidas de EQUI. Los MOT intercompañía no pasan por este almacén.
        </p>
        <Section title="Pendientes de entrada" rows={pending} hrefPrefix="/activos/equi" />
        <Section title="En resguardo" rows={custody} hrefPrefix="/activos/equi" />
      </div>
    );
  }

  if (!canOperateServomotoresCustody(auth.effective.role, slug)) redirect("/inicio");
  const ids = await resolveCompanyIds();
  const [pending, custody] = await Promise.all([
    listMotors({
      activeSlug: slug,
      systronCompanyId: ids.systronId,
      servomotoresCompanyId: ids.servomotoresId,
      intakeFilter: "PENDING_INTAKE",
    }),
    listMotors({
      activeSlug: slug,
      systronCompanyId: ids.systronId,
      servomotoresCompanyId: ids.servomotoresId,
      intakeFilter: "IN_CUSTODY",
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Custodia Servomotores</h1>
      <p className="text-sm text-slate-600">Ingresos, resguardo y egresos de MOT.</p>
      <MotSection title="Pendientes de ingreso" rows={pending} />
      <MotSection title="En resguardo" rows={custody} />
    </div>
  );
}

function Section({
  title,
  rows,
  hrefPrefix,
}: {
  title: string;
  rows: { id: string; folio: string; clientName: string; model: string }[];
  hrefPrefix: string;
}) {
  return (
    <section className="rounded-xl border bg-white">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">{title}</h2>
      <ul className="divide-y text-sm">
        {rows.length === 0 && <li className="px-4 py-6 text-slate-500">Nada pendiente.</li>}
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <Link href={`${hrefPrefix}/${r.id}`} className="font-medium text-sky-800 hover:underline">
              {r.folio}
            </Link>{" "}
            — {r.clientName} · {r.model}
          </li>
        ))}
      </ul>
    </section>
  );
}

function MotSection({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; folio: string; clientName: string; identification: string }[];
}) {
  return (
    <section className="rounded-xl border bg-white">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">{title}</h2>
      <ul className="divide-y text-sm">
        {rows.length === 0 && <li className="px-4 py-6 text-slate-500">Nada pendiente.</li>}
        {rows.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <Link href={`/activos/mot/${r.id}`} className="font-medium text-sky-800 hover:underline">
              {r.folio}
            </Link>{" "}
            — {r.clientName} · {r.identification}
          </li>
        ))}
      </ul>
    </section>
  );
}
