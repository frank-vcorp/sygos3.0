import { listClients } from "@/server/masters/clients";
import { listProspects } from "@/server/masters/prospects";
import { listSuppliers } from "@/server/masters/suppliers";

export type GlobalSearchHit = {
  type: "client" | "prospect" | "supplier";
  id: string;
  label: string;
  sublabel: string | null;
  href: string;
};

export async function runGlobalSearch(params: {
  companyId: string;
  q: string;
  limitPerType?: number;
}): Promise<GlobalSearchHit[]> {
  const term = params.q.trim();
  if (term.length < 2) return [];

  const limit = params.limitPerType ?? 8;
  const [clients, prospects, suppliers] = await Promise.all([
    listClients({ companyId: params.companyId, q: term }),
    listProspects({ companyId: params.companyId, q: term }),
    listSuppliers({ companyId: params.companyId, q: term }),
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

  return hits;
}
