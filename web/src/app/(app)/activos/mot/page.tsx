import Link from "next/link";
import { redirect } from "next/navigation";
import { ListShell } from "@/components/masters/list-shell";
import { SearchForm } from "@/components/masters/search-form";
import type { CompanySlug } from "@/lib/company";
import { resolveCompanyIds } from "@/server/assets/context";
import { motIntakeLabel } from "@/lib/discovery/labels/assets";
import { listMotors } from "@/server/assets/motors";
import { getAuthContext } from "@/server/auth/session";
import { canCreateMotor, canSeeMotors } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function MotListPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canSeeMotors(auth.effective.role, slug)) redirect("/inicio");

  const { q } = await searchParams;
  const ids = await resolveCompanyIds();
  const rows = await listMotors({
    activeSlug: slug,
    systronCompanyId: ids.systronId,
    servomotoresCompanyId: ids.servomotoresId,
    q,
  });

  return (
    <ListShell
      title="Motores MOT"
      description="Secuencia MOT global compartida. SYSTRON solo ve MOT originados en SYSTRON."
      createHref={canCreateMotor(auth.effective.role, slug) ? "/activos/mot/nuevo" : undefined}
      searchSlot={<SearchForm action="/activos/mot" defaultValue={q ?? ""} placeholder="Folio MOT, identificación…" />}
    >
      <table className="min-w-full text-left text-sm">
        <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Folio</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Identificación</th>
            <th className="px-4 py-3">Origen / Custodia SM</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">
                <Link href={`/activos/mot/${r.id}`} className="font-medium text-sky-800 hover:underline">
                  {r.folio}
                </Link>
              </td>
              <td className="px-4 py-3">{r.clientName}</td>
              <td className="px-4 py-3">{r.identification}</td>
              <td className="px-4 py-3">
                {r.origin} ·{" "}
                {motIntakeLabel[r.servomotoresIntakeStatus ?? ""] ?? r.servomotoresIntakeStatus}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
