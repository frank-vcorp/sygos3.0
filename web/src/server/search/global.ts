import { listEquiUnits } from "@/server/assets/equi";
import { resolveCompanyIds } from "@/server/assets/context";
import { listMotors } from "@/server/assets/motors";
import type { CompanySlug } from "@/lib/company";
import { listClients } from "@/server/masters/clients";
import { listProspects } from "@/server/masters/prospects";
import { listSuppliers } from "@/server/masters/suppliers";

export type GlobalSearchHit = {
  type: "client" | "prospect" | "supplier" | "equi" | "motor";
  id: string;
  label: string;
  sublabel: string | null;
  href: string;
};

export async function runGlobalSearch(params: {
  companyId: string;
  companySlug: CompanySlug;
  q: string;
  limitPerType?: number;
}): Promise<GlobalSearchHit[]> {
  const term = params.q.trim();
  if (term.length < 2) return [];

  const limit = params.limitPerType ?? 6;
  const ids = await resolveCompanyIds();

  const [clients, prospects, suppliers, equi, motors] = await Promise.all([
    listClients({ companyId: params.companyId, q: term }),
    listProspects({ companyId: params.companyId, q: term }),
    listSuppliers({ companyId: params.companyId, q: term }),
    params.companySlug === "SYSTRON"
      ? listEquiUnits({ companyId: params.companyId, q: term })
      : Promise.resolve([]),
    listMotors({
      activeSlug: params.companySlug,
      systronCompanyId: ids.systronId,
      servomotoresCompanyId: ids.servomotoresId,
      q: term,
    }),
  ]);

  const hits: GlobalSearchHit[] = [];

  for (const c of clients.slice(0, limit)) {
    hits.push({
      type: "client",
      id: c.id,
      label: c.legalName,
      sublabel: c.responsibleName,
      href: `/comercial/clientes/${c.id}`,
    });
  }
  for (const p of prospects.slice(0, limit)) {
    hits.push({
      type: "prospect",
      id: p.id,
      label: p.name,
      sublabel: p.status,
      href: `/comercial/prospectos/${p.id}`,
    });
  }
  for (const s of suppliers.slice(0, limit)) {
    hits.push({
      type: "supplier",
      id: s.id,
      label: s.legalName,
      sublabel: s.contactName,
      href: `/operacion/proveedores/${s.id}`,
    });
  }
  for (const e of equi.slice(0, limit)) {
    hits.push({
      type: "equi",
      id: e.id,
      label: e.folio,
      sublabel: e.clientName,
      href: `/activos/equi/${e.id}`,
    });
  }
  for (const m of motors.slice(0, limit)) {
    hits.push({
      type: "motor",
      id: m.id,
      label: m.folio,
      sublabel: m.identification,
      href: `/activos/mot/${m.id}`,
    });
  }

  return hits;
}
