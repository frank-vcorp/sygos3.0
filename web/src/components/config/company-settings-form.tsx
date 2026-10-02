"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { companySettings } from "@/db/schema";

type SettingsRow = typeof companySettings.$inferSelect;

type CompanySettingsFormProps = {
  settings: SettingsRow;
  companyName: string;
  companySlug: string;
  canEditCapabilities: boolean;
};

export function CompanySettingsForm({
  settings,
  companyName,
  companySlug,
  canEditCapabilities,
}: CompanySettingsFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      tradeName: String(fd.get("tradeName") || "") || null,
      taxLegalName: String(fd.get("taxLegalName") || "") || null,
      taxRfc: String(fd.get("taxRfc") || "") || null,
      taxRegime: String(fd.get("taxRegime") || "") || null,
      taxZip: String(fd.get("taxZip") || "") || null,
      address: String(fd.get("address") || "") || null,
      contactEmail: String(fd.get("contactEmail") || "") || null,
      contactPhone: String(fd.get("contactPhone") || "") || null,
      logoUrl: String(fd.get("logoUrl") || "") || null,
      directPurchaseMonthlyLimitMxn: Number(
        fd.get("directPurchaseMonthlyLimitMxn"),
      ),
      directPurchaseIndividualLimitMxn: Number(
        fd.get("directPurchaseIndividualLimitMxn"),
      ),
      servomotoresInventoryEnabled:
        companySlug === "SERVOMOTORES" && canEditCapabilities
          ? fd.get("servomotoresInventoryEnabled") === "on"
          : undefined,
      testModeEnabled: fd.get("testModeEnabled") === "on",
      bonusPunctualityMxn: Number(fd.get("bonusPunctualityMxn") || 0),
      bonusProductivityMxn: Number(fd.get("bonusProductivityMxn") || 0),
    };
    const res = await fetch("/api/config/company-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("No se pudo guardar la configuración.");
      return;
    }
    setMessage("Configuración guardada.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {message}
        </p>
      )}
      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Identidad — {companyName}
        </legend>
        <label className="block text-sm">
          Nombre comercial
          <input
            name="tradeName"
            defaultValue={settings.tradeName ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Razón social fiscal
          <input
            name="taxLegalName"
            defaultValue={settings.taxLegalName ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            RFC
            <input
              name="taxRfc"
              defaultValue={settings.taxRfc ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            C.P. fiscal
            <input
              name="taxZip"
              defaultValue={settings.taxZip ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          Régimen fiscal
          <input
            name="taxRegime"
            defaultValue={settings.taxRegime ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Domicilio
          <textarea
            name="address"
            rows={2}
            defaultValue={settings.address ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Correo contacto
            <input
              name="contactEmail"
              type="email"
              defaultValue={settings.contactEmail ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Teléfono contacto
            <input
              name="contactPhone"
              defaultValue={settings.contactPhone ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          URL logotipo (referencia)
          <input
            name="logoUrl"
            defaultValue={settings.logoUrl ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Compras — límites por defecto (Gerente Operativo)
        </legend>
        <label className="block text-sm">
          Bolsa mensual compra directa (MXN)
          <input
            name="directPurchaseMonthlyLimitMxn"
            type="number"
            min={0}
            defaultValue={settings.directPurchaseMonthlyLimitMxn}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Máximo individual compra directa (MXN)
          <input
            name="directPurchaseIndividualLimitMxn"
            type="number"
            min={0}
            defaultValue={settings.directPurchaseIndividualLimitMxn}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </fieldset>

      {companySlug === "SERVOMOTORES" && canEditCapabilities && (
        <fieldset className="rounded-xl border border-slate-200 bg-white p-6">
          <legend className="px-1 text-sm font-semibold text-slate-900">
            Capacidades de empresa
          </legend>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="servomotoresInventoryEnabled"
              defaultChecked={settings.servomotoresInventoryEnabled}
            />
            Habilitar Inventario Servomotores
          </label>
        </fieldset>
      )}

      <fieldset className="rounded-xl border border-slate-200 bg-white p-6">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Bonos de nómina (mensual)
        </legend>
        <p className="mt-1 text-xs text-slate-500">
          Se incluyen en el borrador de la semana que cierra el mes. Gerente SM excluido.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Bono puntualidad (MXN/mes)
            <input
              name="bonusPunctualityMxn"
              type="number"
              min={0}
              defaultValue={settings.bonusPunctualityMxn}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Bono productividad (MXN/mes)
            <input
              name="bonusProductivityMxn"
              type="number"
              min={0}
              defaultValue={settings.bonusProductivityMxn}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
        <legend className="px-1 text-sm font-semibold text-slate-900">
          Modo de pruebas (Fase 9)
        </legend>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="testModeEnabled"
            defaultChecked={settings.testModeEnabled}
          />
          Simular integraciones externas para toda la empresa (timbrado, cancelaciones)
        </label>
        <p className="mt-2 text-xs text-slate-600">
          Preferible usar{" "}
          <a href="/configuracion/modo-pruebas" className="text-sygos-teal underline">
            Modo de pruebas por participantes
          </a>{" "}
          para no afectar al resto del equipo.
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-sygos-navy px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
