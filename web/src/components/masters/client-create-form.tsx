"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ResponsibleOption = { id: string; displayName: string; role: string };

type ClientCreateFormProps = {
  canPickResponsible: boolean;
  responsibleOptions: ResponsibleOption[];
};

export function ClientCreateForm({
  canPickResponsible,
  responsibleOptions,
}: ClientCreateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const creditRaw = String(fd.get("creditDays") ?? "").trim();
    const body = {
      legalName: String(fd.get("legalName")),
      classification: (fd.get("classification") as string) || null,
      requiresInvoice: fd.get("requiresInvoice") === "on",
      creditDays: creditRaw ? Number(creditRaw) : null,
      deliveryAddress: String(fd.get("deliveryAddress") || "") || null,
      taxLegalName: String(fd.get("taxLegalName") || "") || null,
      taxRfc: String(fd.get("taxRfc") || "") || null,
      taxRegime: String(fd.get("taxRegime") || "") || null,
      taxZip: String(fd.get("taxZip") || "") || null,
      commercialResponsibleUserId:
        String(fd.get("commercialResponsibleUserId") || "") || undefined,
      primaryContact: String(fd.get("contactName") || "").trim()
        ? {
            name: String(fd.get("contactName")),
            phone: String(fd.get("contactPhone") || "") || undefined,
            jobTitle: String(fd.get("contactJobTitle") || "") || undefined,
            email: String(fd.get("contactEmail") || "") || undefined,
          }
        : undefined,
    };
    const res = await fetch("/api/masters/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el cliente.");
      return;
    }
    router.push(`/comercial/clientes/${data.client.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Datos generales
        </legend>
        <label className="block text-sm">
          <span className="text-slate-700">Razón social *</span>
          <input
            name="legalName"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {canPickResponsible && (
          <label className="block text-sm">
            <span className="text-slate-700">Responsable comercial</span>
            <select
              name="commercialResponsibleUserId"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              defaultValue=""
            >
              <option value="">Automático según regla</option>
              {responsibleOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-sm">
          <span className="text-slate-700">Clasificación</span>
          <select
            name="classification"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            defaultValue=""
          >
            <option value="">Sin clasificar</option>
            <option value="NORMAL">Normal</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="requiresInvoice" />
          Requiere factura
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Días de crédito</span>
          <input
            name="creditDays"
            type="number"
            min={0}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Dirección de entrega</span>
          <textarea
            name="deliveryAddress"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Datos fiscales (opcional al alta)
        </legend>
        <label className="block text-sm">
          <span className="text-slate-700">Razón social fiscal</span>
          <input
            name="taxLegalName"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">RFC</span>
            <input
              name="taxRfc"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">C.P. fiscal</span>
            <input
              name="taxZip"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-700">Régimen fiscal</span>
          <input
            name="taxRegime"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Contacto principal (opcional)
        </legend>
        <label className="block text-sm">
          <span className="text-slate-700">Nombre</span>
          <input
            name="contactName"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">Teléfono</span>
            <input
              name="contactPhone"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Correo</span>
            <input
              name="contactEmail"
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-700">Puesto</span>
          <input
            name="contactJobTitle"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-sygos-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-sygos-navy-sidebar disabled:opacity-60"
      >
        {loading ? "Guardando…" : "Crear cliente"}
      </button>
    </form>
  );
}
