"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { clientContacts, clients } from "@/db/schema";

type ClientRow = typeof clients.$inferSelect;
type ContactRow = typeof clientContacts.$inferSelect;

type ResponsibleOption = { id: string; displayName: string };

type ClientDetailPanelProps = {
  client: ClientRow;
  contacts: ContactRow[];
  responsibleName: string;
  canReassign: boolean;
  responsibleOptions: ResponsibleOption[];
};

export function ClientDetailPanel({
  client,
  contacts,
  responsibleName,
  canReassign,
  responsibleOptions,
}: ClientDetailPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
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
      isActive: fd.get("isActive") === "on",
      commercialResponsibleUserId:
        String(fd.get("commercialResponsibleUserId") || "") || undefined,
    };
    const res = await fetch(`/api/masters/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "No se pudo guardar.");
      return;
    }
    setMessage("Cliente actualizado.");
    router.refresh();
  }

  async function addContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/masters/clients/${client.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        phone: String(fd.get("phone") || "") || undefined,
        jobTitle: String(fd.get("jobTitle") || "") || undefined,
        email: String(fd.get("email") || "") || undefined,
        isPrimary: fd.get("isPrimary") === "on",
      }),
    });
    if (!res.ok) {
      setMessage("No se pudo agregar el contacto.");
      return;
    }
    (e.target as HTMLFormElement).reset();
    setMessage("Contacto agregado.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {message}
        </p>
      )}
      <form
        onSubmit={saveClient}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <p className="text-sm text-slate-500">
          Responsable actual: <strong>{responsibleName}</strong>
        </p>
        <label className="block text-sm">
          <span className="text-slate-700">Razón social</span>
          <input
            name="legalName"
            defaultValue={client.legalName}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {canReassign && (
          <label className="block text-sm">
            <span className="text-slate-700">Reasignar responsable</span>
            <select
              name="commercialResponsibleUserId"
              defaultValue={client.commercialResponsibleUserId}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
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
            defaultValue={client.classification ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Sin clasificar</option>
            <option value="NORMAL">Normal</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="requiresInvoice"
            defaultChecked={client.requiresInvoice}
          />
          Requiere factura
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={client.isActive}
          />
          Activo
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Días de crédito</span>
          <input
            name="creditDays"
            type="number"
            min={0}
            defaultValue={client.creditDays ?? ""}
            className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Dirección de entrega</span>
          <textarea
            name="deliveryAddress"
            rows={2}
            defaultValue={client.deliveryAddress ?? ""}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-700">RFC</span>
            <input
              name="taxRfc"
              defaultValue={client.taxRfc ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Razón social fiscal</span>
            <input
              name="taxLegalName"
              defaultValue={client.taxLegalName ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-700">Régimen / C.P.</span>
          <div className="mt-1 flex gap-2">
            <input
              name="taxRegime"
              placeholder="Régimen"
              defaultValue={client.taxRegime ?? ""}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
            />
            <input
              name="taxZip"
              placeholder="C.P."
              defaultValue={client.taxZip ?? ""}
              className="w-28 rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white"
        >
          {loading ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Contactos</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {contacts.length === 0 && (
            <li className="py-3 text-sm text-slate-500">Sin contactos.</li>
          )}
          {contacts.map((c) => (
            <li key={c.id} className="py-3 text-sm">
              <p className="font-medium text-slate-900">
                {c.name}
                {c.isPrimary && (
                  <span className="ml-2 text-xs text-sky-700">Principal</span>
                )}
                {!c.isActive && (
                  <span className="ml-2 text-xs text-slate-400">Inactivo</span>
                )}
              </p>
              <p className="text-slate-600">
                {[c.jobTitle, c.phone, c.email].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
        <form onSubmit={addContact} className="mt-6 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            required
            placeholder="Nombre contacto"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="phone"
            placeholder="Teléfono"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="email"
            placeholder="Correo"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="jobTitle"
            placeholder="Puesto"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="isPrimary" />
            Marcar como principal
          </label>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium sm:col-span-2"
          >
            Agregar contacto
          </button>
        </form>
      </section>
    </div>
  );
}
