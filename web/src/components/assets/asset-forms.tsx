"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClientOption = { id: string; legalName: string };
type CatalogOption = { id: string; name: string };

export function EquiCreateForm({
  clients,
  types,
  brands,
}: {
  clients: ClientOption[];
  types: CatalogOption[];
  brands: CatalogOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/assets/equi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: String(fd.get("clientId")),
        typeId: String(fd.get("typeId") || "") || undefined,
        brandId: String(fd.get("brandId") || "") || undefined,
        typeName: String(fd.get("typeName") || "") || undefined,
        brandName: String(fd.get("brandName") || "") || undefined,
        model: String(fd.get("model")),
        description: String(fd.get("description") || "") || undefined,
        serialNumber: String(fd.get("serialNumber") || "") || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear EQUI.");
      return;
    }
    router.push(`/activos/equi/${data.equi.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <label className="block text-sm">
        Cliente *
        <select name="clientId" required className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="">Seleccionar…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.legalName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Tipo (catálogo)
        <select name="typeId" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="">— o alta rápida —</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Tipo (alta rápida)
        <input name="typeName" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Marca (catálogo)
        <select name="brandId" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="">— o alta rápida —</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Marca (alta rápida)
        <input name="brandName" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Modelo *
        <input name="model" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Serial fabricante
        <input name="serialNumber" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Descripción
        <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <button type="submit" className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white">
        Crear EQUI
      </button>
    </form>
  );
}

export function MotorCreateForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/assets/motors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: String(fd.get("clientId")),
        identification: String(fd.get("identification")),
        brand: String(fd.get("brand") || "") || undefined,
        model: String(fd.get("model") || "") || undefined,
        serialNumber: String(fd.get("serialNumber") || "") || undefined,
        notes: String(fd.get("notes") || "") || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear MOT.");
      return;
    }
    router.push(`/activos/mot/${data.motor.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <label className="block text-sm">
        Cliente *
        <select name="clientId" required className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="">Seleccionar…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.legalName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Identificación motor/servomotor *
        <input name="identification" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Marca
          <input name="brand" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="block text-sm">
          Modelo
          <input name="model" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
      </div>
      <label className="block text-sm">
        Serial
        <input name="serialNumber" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Notas
        <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <button type="submit" className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white">
        Crear MOT (folio global)
      </button>
    </form>
  );
}

export function MovementActions({
  entityKind,
  entityId,
  allowedTypes,
}: {
  entityKind: "equi" | "motor";
  entityId: string;
  allowedTypes: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const url =
      entityKind === "equi"
        ? `/api/assets/equi/${entityId}/movements`
        : `/api/assets/motors/${entityId}/custody`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movementType: String(fd.get("movementType")),
        motive: String(fd.get("motive") || "") || undefined,
        receiverName: String(fd.get("receiverName") || "") || undefined,
        receiverNotes: String(fd.get("receiverNotes") || "") || undefined,
        enablingDocumentRef: String(fd.get("enablingDocumentRef") || "") || undefined,
      }),
    });
    if (!res.ok) {
      setMessage("No se registró el movimiento.");
      return;
    }
    setMessage("Movimiento registrado.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Registrar movimiento físico</h3>
      {message && <p className="text-sm text-sky-800">{message}</p>}
      <select name="movementType" required className="w-full rounded-lg border px-3 py-2 text-sm">
        {allowedTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input name="motive" placeholder="Motivo" className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input name="receiverName" placeholder="Receptor" className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input
        name="enablingDocumentRef"
        placeholder="Doc. habilitante (factura/remisión)"
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />
      <textarea name="receiverNotes" placeholder="Observaciones" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
      <button type="submit" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">
        Confirmar
      </button>
    </form>
  );
}
