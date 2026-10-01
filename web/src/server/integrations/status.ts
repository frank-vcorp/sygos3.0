import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  companyIntegrations,
  type IntegrationProvider,
} from "@/db/schema";

const PROVIDERS: IntegrationProvider[] = [
  "facturapi",
  "sendgrid",
  "whatsapp",
];

const LABELS: Record<IntegrationProvider, string> = {
  facturapi: "Facturapi",
  sendgrid: "SendGrid",
  whatsapp: "WhatsApp",
};

export async function getMissingIntegrations(
  companyId: string,
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(companyIntegrations)
    .where(eq(companyIntegrations.companyId, companyId));

  const missing: string[] = [];
  for (const provider of PROVIDERS) {
    const row = rows.find((r) => r.provider === provider);
    if (provider === "whatsapp") {
      if (!row?.enabled) continue;
      if (!row.configCiphertext) missing.push(LABELS[provider]);
      continue;
    }
    if (!row?.enabled || !row.configCiphertext) {
      missing.push(LABELS[provider]);
    }
  }
  return missing;
}

export async function listIntegrationsForCompany(companyId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(companyIntegrations)
    .where(eq(companyIntegrations.companyId, companyId));

  return PROVIDERS.map((provider) => {
    const row = rows.find((r) => r.provider === provider);
    return {
      provider,
      label: LABELS[provider],
      enabled: row?.enabled ?? false,
      configured: Boolean(row?.configCiphertext),
      hint: row?.configHint ?? null,
    };
  });
}

export async function upsertIntegration(params: {
  companyId: string;
  provider: IntegrationProvider;
  enabled: boolean;
  config?: Record<string, string>;
  mergeConfig?: boolean;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(companyIntegrations)
    .where(
      and(
        eq(companyIntegrations.companyId, params.companyId),
        eq(companyIntegrations.provider, params.provider),
      ),
    )
    .limit(1);

  let configCiphertext = existing?.configCiphertext ?? null;
  let configHint = existing?.configHint ?? null;

  if (params.config && Object.keys(params.config).length > 0) {
    const { encryptJson, decryptJson, maskSecret } = await import(
      "@/server/crypto/secrets"
    );
    const merged =
      params.mergeConfig && existing?.configCiphertext
        ? {
            ...decryptJson<Record<string, string>>(existing.configCiphertext),
            ...params.config,
          }
        : params.config;
    const secretKey = merged.apiKey ?? merged.api_key ?? Object.values(merged)[0];
    if (secretKey) configHint = maskSecret(secretKey);
    configCiphertext = encryptJson(merged);
  }

  if (existing) {
    await db
      .update(companyIntegrations)
      .set({
        enabled: params.enabled,
        configCiphertext,
        configHint,
        updatedAt: new Date(),
      })
      .where(eq(companyIntegrations.id, existing.id));
  } else {
    await db.insert(companyIntegrations).values({
      companyId: params.companyId,
      provider: params.provider,
      enabled: params.enabled,
      configCiphertext,
      configHint,
    });
  }
}
