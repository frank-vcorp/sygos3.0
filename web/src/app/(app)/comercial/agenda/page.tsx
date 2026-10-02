import { redirect } from "next/navigation";
import { ActivityQuickForm } from "@/components/commercial/commercial-forms";
import { listActivityCategories } from "@/server/commercial/bootstrap";
import { listActivities } from "@/server/commercial/agenda";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import { canUseCommercialAgenda } from "@/server/rbac/commercial";
import type { CompanySlug } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function AgendaComercialPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canUseCommercialAgenda(auth.effective.role, slug)) redirect("/inicio");

  const [categories, clients, activities] = await Promise.all([
    listActivityCategories(auth.activeCompany.id),
    listClients({ companyId: auth.activeCompany.id }),
    listActivities({
      companyId: auth.activeCompany.id,
      ownerUserId: auth.effective.id,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Agenda comercial</h1>
        <p className="mt-1 text-sm text-slate-500">
          Día / semana / mes — sin recordatorios automáticos.
        </p>
      </div>
      <ActivityQuickForm
        categories={categories.filter((c) => c.isActive).map((c) => ({ id: c.id, name: c.name }))}
        clients={clients.map((c) => ({ id: c.id, legalName: c.legalName }))}
      />
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
        {activities.map(({ activity, clientName, categoryName }) => (
          <li key={activity.id} className="px-4 py-3 text-sm">
            <p className="font-medium">{activity.title}</p>
            <p className="text-slate-500">
              {activity.occurredAt.toLocaleString("es-MX")} ·{" "}
              {categoryName ?? activity.categoryLabel ?? "—"}
              {clientName ? ` · ${clientName}` : ""}
            </p>
          </li>
        ))}
        {activities.length === 0 && (
          <li className="px-4 py-8 text-center text-slate-500">Sin actividades.</li>
        )}
      </ul>
    </div>
  );
}
