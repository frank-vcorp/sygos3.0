import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companyIntegrations } from "@/db/schema";
import { decryptJson } from "@/server/crypto/secrets";

export type FacturapiEmitResult = {
  invoiceId: string;
  uuid: string;
  simulated: boolean;
};

export async function getFacturapiApiKey(
  companyId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(companyIntegrations)
    .where(
      and(
        eq(companyIntegrations.companyId, companyId),
        eq(companyIntegrations.provider, "facturapi"),
        eq(companyIntegrations.enabled, true),
      ),
    )
    .limit(1);
  if (!row?.configCiphertext) return null;
  const cfg = decryptJson<Record<string, string>>(row.configCiphertext);
  return cfg.apiKey ?? cfg.api_key ?? null;
}

export async function emitInvoiceWithFacturapi(params: {
  companyId: string;
  idempotencyKey: string;
  customer: { legal_name: string; tax_id: string; tax_system?: string };
  items: { description: string; quantity: number; product: { price: number } }[];
  totalMxn: number;
}): Promise<FacturapiEmitResult> {
  const apiKey = await getFacturapiApiKey(params.companyId);
  if (!apiKey) {
    return {
      invoiceId: `sim-${params.idempotencyKey.slice(0, 8)}`,
      uuid: `00000000-0000-4000-8000-${params.idempotencyKey.replace(/-/g, "").slice(0, 12)}`,
      simulated: true,
    };
  }

  const res = await fetch("https://www.facturapi.io/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: params.customer,
      items: params.items,
      idempotency_key: params.idempotencyKey,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 500) || `Facturapi HTTP ${res.status}`);
  }

  const data = (await res.json()) as { id: string; uuid?: string };
  return {
    invoiceId: data.id,
    uuid: data.uuid ?? data.id,
    simulated: false,
  };
}

export async function cancelInvoiceWithFacturapi(params: {
  companyId: string;
  facturapiInvoiceId: string;
}) {
  const apiKey = await getFacturapiApiKey(params.companyId);
  if (!apiKey || params.facturapiInvoiceId.startsWith("sim-")) {
    return { ok: true, simulated: true };
  }
  const res = await fetch(
    `https://www.facturapi.io/v2/invoices/${params.facturapiInvoiceId}/cancel`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 500) || `Cancel failed ${res.status}`);
  }
  return { ok: true, simulated: false };
}
