import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { companyIntegrations, type UserRole } from "@/db/schema";
import { decryptJson } from "@/server/crypto/secrets";
import {
  shouldSimulateExternalEffects,
  shouldUseInternalFiscalOnly,
} from "@/server/integrations/external-policy";
import { IntegrationMissingError } from "@/server/integrations/errors";

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

function simulatedInvoice(params: {
  idempotencyKey: string;
  prefix: "test" | "sim" | "internal";
}) {
  return {
    invoiceId: `${params.prefix}-${params.idempotencyKey.slice(0, 8)}`,
    uuid: `00000000-0000-4000-8000-${params.idempotencyKey.replace(/-/g, "").slice(0, 12)}`,
    simulated: true,
  };
}

function isSimulatedExternalId(id: string): boolean {
  return (
    id.startsWith("test-") ||
    id.startsWith("sim-") ||
    id.startsWith("internal-")
  );
}

export async function emitInvoiceWithFacturapi(params: {
  companyId: string;
  actorUserId: string;
  actorRole: UserRole;
  idempotencyKey: string;
  customer: { legal_name: string; tax_id: string; tax_system?: string };
  items: { description: string; quantity: number; product: { price: number } }[];
  totalMxn: number;
}): Promise<FacturapiEmitResult> {
  if (
    await shouldSimulateExternalEffects({
      companyId: params.companyId,
      userId: params.actorUserId,
      role: params.actorRole,
    })
  ) {
    return simulatedInvoice({
      idempotencyKey: params.idempotencyKey,
      prefix: "test",
    });
  }

  if (shouldUseInternalFiscalOnly()) {
    return simulatedInvoice({
      idempotencyKey: params.idempotencyKey,
      prefix: "internal",
    });
  }

  const apiKey = await getFacturapiApiKey(params.companyId);
  if (!apiKey) {
    throw new IntegrationMissingError(
      "Facturapi",
      "Facturapi no está configurada. Configure integraciones o active Modo de Pruebas.",
    );
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
  actorUserId: string;
  actorRole: UserRole;
  facturapiInvoiceId: string;
}) {
  if (isSimulatedExternalId(params.facturapiInvoiceId)) {
    return { ok: true, simulated: true };
  }

  if (
    await shouldSimulateExternalEffects({
      companyId: params.companyId,
      userId: params.actorUserId,
      role: params.actorRole,
    })
  ) {
    return { ok: true, simulated: true };
  }

  const apiKey = await getFacturapiApiKey(params.companyId);
  if (!apiKey) {
    throw new IntegrationMissingError("Facturapi");
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

export type PayrollReceiptResult = {
  receiptId: string;
  uuid: string;
  simulated: boolean;
};

export async function emitPayrollReceiptWithFacturapi(params: {
  companyId: string;
  actorUserId: string;
  actorRole: UserRole;
  idempotencyKey: string;
  employee: { legal_name: string; tax_id: string; tax_system?: string };
  amountMxn: number;
  periodLabel: string;
}): Promise<PayrollReceiptResult> {
  if (
    await shouldSimulateExternalEffects({
      companyId: params.companyId,
      userId: params.actorUserId,
      role: params.actorRole,
    })
  ) {
    return {
      receiptId: `test-nom-${params.idempotencyKey.slice(0, 8)}`,
      uuid: `00000000-0000-4000-8000-${params.idempotencyKey.replace(/-/g, "").slice(0, 12)}`,
      simulated: true,
    };
  }

  if (shouldUseInternalFiscalOnly()) {
    return {
      receiptId: `internal-nom-${params.idempotencyKey.slice(0, 8)}`,
      uuid: `00000000-0000-4000-8000-${params.idempotencyKey.replace(/-/g, "").slice(0, 12)}`,
      simulated: true,
    };
  }

  const apiKey = await getFacturapiApiKey(params.companyId);
  if (!apiKey) {
    throw new IntegrationMissingError(
      "Facturapi",
      "Configure Facturapi o active Modo de Pruebas para simular nómina.",
    );
  }

  const res = await fetch("https://www.facturapi.io/v2/payroll-receipts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      employee: params.employee,
      type: "O",
      payment: {
        amount: params.amountMxn,
        currency: "MXN",
      },
      idempotency_key: params.idempotencyKey,
      memo: `Nómina ${params.periodLabel}`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.slice(0, 500) || `Facturapi nómina HTTP ${res.status}`);
  }

  const data = (await res.json()) as { id: string; uuid?: string };
  return {
    receiptId: data.id,
    uuid: data.uuid ?? data.id,
    simulated: false,
  };
}

export async function probeFacturapiConnection(companyId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  if (shouldUseInternalFiscalOnly()) {
    return {
      ok: true,
      message:
        "Staging UAT: fiscal interno activo (SYGOS_INTERNAL_FISCAL). Sin llamadas a Facturapi.",
    };
  }
  const apiKey = await getFacturapiApiKey(companyId);
  if (!apiKey) {
    return { ok: false, message: "Sin API key o integración deshabilitada." };
  }
  const res = await fetch("https://www.facturapi.io/v2/organizations", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      message: text.slice(0, 200) || `HTTP ${res.status}`,
    };
  }
  return { ok: true, message: "Conexión OK con Facturapi." };
}
