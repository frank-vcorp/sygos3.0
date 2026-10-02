import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  diagnostics,
  quotes,
  serviceAttentions,
  workOrders,
} from "@/db/schema";
import { formatOsFolio, formatQuoteFolio } from "@/server/masters/folios";
import { formatDiagFolio } from "@/server/ops/diagnostics";

export async function listEquiRelationLinks(params: {
  companyId: string;
  equiId: string;
  clientId: string;
}) {
  const db = getDb();
  const links: { href: string; label: string }[] = [];

  links.push({
    href: `/comercial/clientes/${params.clientId}`,
    label: "Cliente",
  });

  const diags = await db
    .select({ id: diagnostics.id, folioNumber: diagnostics.folioNumber })
    .from(diagnostics)
    .innerJoin(serviceAttentions, eq(serviceAttentions.id, diagnostics.attentionId))
    .where(eq(serviceAttentions.equiId, params.equiId))
    .orderBy(desc(diagnostics.createdAt))
    .limit(5);

  for (const d of diags) {
    links.push({
      href: `/operacion/diagnosticos/${d.id}`,
      label: `Diagnóstico ${formatDiagFolio(d.folioNumber)}`,
    });
  }

  const osRows = await db
    .select({ id: workOrders.id, folioNumber: workOrders.folioNumber })
    .from(workOrders)
    .where(
      and(
        eq(workOrders.equiId, params.equiId),
        eq(workOrders.companyId, params.companyId),
      ),
    )
    .orderBy(desc(workOrders.createdAt))
    .limit(5);

  for (const o of osRows) {
    links.push({
      href: `/operacion/os/${o.id}`,
      label: `OS ${formatOsFolio(o.folioNumber)}`,
    });
  }

  const quoteRows = await db
    .select({ id: quotes.id, folioNumber: quotes.folioNumber })
    .from(quotes)
    .where(eq(quotes.equiId, params.equiId))
    .orderBy(desc(quotes.updatedAt))
    .limit(5);

  for (const q of quoteRows) {
    links.push({
      href: `/comercial/cotizaciones/${q.id}`,
      label: `Cotización ${formatQuoteFolio(q.folioNumber)}`,
    });
  }

  return links;
}

export async function listMotorRelationLinks(params: {
  motorId: string;
  clientId: string | null;
}) {
  const db = getDb();
  const links: { href: string; label: string }[] = [];

  if (params.clientId) {
    links.push({
      href: `/comercial/clientes/${params.clientId}`,
      label: "Cliente",
    });
  }

  const diags = await db
    .select({ id: diagnostics.id, folioNumber: diagnostics.folioNumber })
    .from(diagnostics)
    .innerJoin(serviceAttentions, eq(serviceAttentions.id, diagnostics.attentionId))
    .where(eq(serviceAttentions.motorId, params.motorId))
    .orderBy(desc(diagnostics.createdAt))
    .limit(5);

  for (const d of diags) {
    links.push({
      href: `/operacion/diagnosticos/${d.id}`,
      label: `Diagnóstico ${formatDiagFolio(d.folioNumber)}`,
    });
  }

  const osRows = await db
    .select({ id: workOrders.id, folioNumber: workOrders.folioNumber })
    .from(workOrders)
    .where(eq(workOrders.motorId, params.motorId))
    .orderBy(desc(workOrders.createdAt))
    .limit(5);

  for (const o of osRows) {
    links.push({
      href: `/operacion/os/${o.id}`,
      label: `OS ${formatOsFolio(o.folioNumber)}`,
    });
  }

  return links;
}
