"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CompanySlug } from "@/lib/company";

type IntegrationRow = {
  provider: string;
  label: string;
  enabled: boolean;
  configured: boolean;
  hint: string | null;
};

type IntegrationsFormProps = {
  companySlug: CompanySlug;
  integrations: IntegrationRow[];
};

export function IntegrationsForm({
  companySlug,
  integrations: initial,
}: IntegrationsFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function save(
    provider: string,
    enabled: boolean,
    fields: Record<string, string>,
  ) {
    setLoading(provider);
    setMessage(null);
    const config = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v.trim() !== ""),
    );
    const res = await fetch("/api/config/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companySlug,
        provider,
        enabled,
        config: Object.keys(config).length ? config : undefined,
      }),
    });
    setLoading(null);
    if (!res.ok) {
      setMessage("No se pudo guardar. Revisa los datos.");
      return;
    }
    setMessage("Configuración guardada.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {message}
        </p>
      )}
      {initial.map((row) => (
        <IntegrationCard
          key={row.provider}
          row={row}
          saving={loading === row.provider}
          onSave={save}
        />
      ))}
    </div>
  );
}

function IntegrationCard({
  row,
  saving,
  onSave,
}: {
  row: IntegrationRow;
  saving: boolean;
  onSave: (
    provider: string,
    enabled: boolean,
    fields: Record<string, string>,
  ) => void;
}) {
  const [enabled, setEnabled] = useState(row.enabled);
  const [apiKey, setApiKey] = useState("");
  const [extra, setExtra] = useState("");
  const [probe, setProbe] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);

  const fields: Record<string, string> =
    row.provider === "sendgrid"
      ? { apiKey, fromEmail: extra }
      : row.provider === "facturapi"
        ? { apiKey, organizationId: extra }
        : { sessionNote: extra };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{row.label}</h2>
          {row.configured && row.hint && (
            <p className="text-xs text-slate-500">Credencial actual: {row.hint}</p>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Habilitada
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {row.provider === "sendgrid" ? "API Key" : "Llave / token"}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={row.configured ? "Dejar vacío para conservar" : "Pegar credencial"}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            {row.provider === "sendgrid"
              ? "Correo remitente"
              : row.provider === "facturapi"
                ? "Organization ID (opcional)"
                : "Notas / estado QR (placeholder)"}
          </label>
          <input
            type="text"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </div>
      {row.provider === "whatsapp" && (
        <p className="mt-2 text-xs text-slate-500">
          Vinculación Baileys por QR en iteración siguiente; aquí solo
          habilitación y número por empresa.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(row.provider, enabled, fields)}
          className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
        {row.provider === "facturapi" && row.configured && (
          <button
            type="button"
            disabled={probing}
            onClick={async () => {
              setProbing(true);
              setProbe(null);
              const res = await fetch("/api/config/integrations/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: "facturapi" }),
              });
              const data = (await res.json()) as { ok: boolean; message: string };
              setProbe(data.ok ? `✓ ${data.message}` : data.message);
              setProbing(false);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {probing ? "Probando…" : "Probar conexión"}
          </button>
        )}
      </div>
      {probe && (
        <p className={`mt-2 text-xs ${probe.startsWith("✓") ? "text-emerald-700" : "text-red-700"}`}>
          {probe}
        </p>
      )}
    </section>
  );
}
