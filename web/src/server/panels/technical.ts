import type { CompanySlug } from "@/lib/company";
import { listWorkOrdersForPanel } from "@/server/assets/work-orders";
import { listDiagnostics } from "@/server/ops/diagnostics";

export type PanelLink = { href: string; label: string };

function diagRowLink(id: string, folio: string, extra: string): PanelLink {
  return {
    href: `/operacion/diagnosticos/${id}`,
    label: `${folio} · ${extra}`,
  };
}

function osRowLink(id: string, folio: string, extra: string): PanelLink {
  return { href: `/operacion/os/${id}`, label: `${folio} · ${extra}` };
}

export async function buildTechnicianPanel(params: {
  userId: string;
  activeSlug: CompanySlug;
  companyId: string;
  filter?: "all" | "overdue" | "refacciones";
}) {
  const filter = params.filter ?? "all";

  if (filter === "refacciones") {
    const orders = await listWorkOrdersForPanel({
      companyId: params.companyId,
      assignedUserId: params.userId,
      repairStatus: ["EN_ESPERA_REFACCIONES"],
      limit: 40,
    });
    return {
      filter,
      diagnostics: [] as PanelLink[],
      workOrders: orders.map((o) =>
        osRowLink(o.id, o.folio, o.repairStatus),
      ),
    };
  }

  const diagParams = {
    activeSlug: params.activeSlug,
    companyId: params.companyId,
    assignedUserId: params.userId,
    activeOnly: true,
    limit: 40,
    overdueOnly: filter === "overdue",
  };

  const [diagnostics, workOrders] = await Promise.all([
    listDiagnostics(diagParams),
    listWorkOrdersForPanel({
      companyId: params.companyId,
      assignedUserId: params.userId,
      activeOnly: true,
      limit: 40,
    }),
  ]);

  const diagLinks = diagnostics.map((d) => {
    const sla =
      d.slaDueAt && d.slaDueAt.getTime() < Date.now() ? " · SLA vencido" : "";
    return diagRowLink(
      d.id,
      d.folio,
      `${d.status}${d.frozenPriorityLabel ? ` · ${d.frozenPriorityLabel}` : ""}${sla}`,
    );
  });

  const woLinks = workOrders
    .filter((o) => o.repairStatus !== "EN_ESPERA_REFACCIONES" || filter === "all")
    .map((o) => osRowLink(o.id, o.folio, o.repairStatus));

  return { filter, diagnostics: diagLinks, workOrders: woLinks };
}

export async function buildOpsSystronPanel(params: {
  activeSlug: CompanySlug;
  companyId: string;
}) {
  const [
    unassignedDiag,
    validationQueue,
    overdueDiag,
    waitingParts,
    unassignedOs,
    activeRepairs,
  ] = await Promise.all([
    listDiagnostics({
      activeSlug: params.activeSlug,
      companyId: params.companyId,
      unassignedOnly: true,
      activeOnly: true,
      limit: 25,
    }),
    listDiagnostics({
      activeSlug: params.activeSlug,
      companyId: params.companyId,
      validationQueue: true,
      limit: 25,
    }),
    listDiagnostics({
      activeSlug: params.activeSlug,
      companyId: params.companyId,
      overdueOnly: true,
      limit: 25,
    }),
    listWorkOrdersForPanel({
      companyId: params.companyId,
      repairStatus: ["EN_ESPERA_REFACCIONES"],
      limit: 25,
    }),
    listWorkOrdersForPanel({
      companyId: params.companyId,
      unassignedOnly: true,
      activeOnly: true,
      limit: 25,
    }),
    listWorkOrdersForPanel({
      companyId: params.companyId,
      activeOnly: true,
      limit: 25,
    }),
  ]);

  return {
    unassignedDiagnostics: unassignedDiag.map((d) =>
      diagRowLink(d.id, d.folio, d.status),
    ),
    validationQueue: validationQueue.map((d) =>
      diagRowLink(d.id, d.folio, d.reportedFailure.slice(0, 60)),
    ),
    overdueDiagnostics: overdueDiag.map((d) =>
      diagRowLink(d.id, d.folio, d.assignedName ?? "Sin técnico"),
    ),
    waitingParts: waitingParts.map((o) =>
      osRowLink(o.id, o.folio, o.assignedName ?? "Sin asignar"),
    ),
    unassignedWorkOrders: unassignedOs.map((o) =>
      osRowLink(o.id, o.folio, o.repairStatus),
    ),
    activeRepairs: activeRepairs.map((o) =>
      osRowLink(
        o.id,
        o.folio,
        `${o.repairStatus}${o.assignedName ? ` · ${o.assignedName}` : ""}`,
      ),
    ),
    counts: {
      unassignedDiagnostics: unassignedDiag.length,
      validationQueue: validationQueue.length,
      overdueDiagnostics: overdueDiag.length,
      waitingParts: waitingParts.length,
    },
  };
}
