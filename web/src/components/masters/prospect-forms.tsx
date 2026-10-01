"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { prospects } from "@/db/schema";

type ProspectRow = typeof prospects.$inferSelect;
type ResponsibleOption = { id: string; displayName: string };

const statusLabels: Record<string, string> = {
  NUEVO: "Nuevo",
  EN_SEGUIMIENTO: "En seguimiento",
  CONVERTIDO: "Convertido",
  DESCARTADO: "Descartado",
};

export function ProspectCreateForm({
  responsibleOptions,
}: {
  responsibleOptions: ResponsibleOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/masters/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        responsibleUserId:
          String(fd.get("responsibleUserId") || "") || undefined,
        source: String(fd.get("source") || "") || undefined,
        notes: String(fd.get("notes") || "") || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No se pudo crear.");
      return;
    }
    router.push(`/comercial/prospectos/${data.prospect.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <label className="block text-sm">
        Nombre / empresa *
        <input
          name="name"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Responsable
        <select
          name="responsibleUserId"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">Automático</option>
          {responsibleOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Fuente
        <input
          name="source"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Notas
        <textarea
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white"
      >
        Crear prospecto
      </button>
    </form>
  );
}

export function ProspectDetailPanel({
  prospect,
  responsibleName,
  convertedClientName,
  convertedClientId,
  canConvert,
  responsibleOptions,
}: {
  prospect: ProspectRow;
  responsibleName: string;
  convertedClientName: string | null;
  convertedClientId: string | null;
  canConvert: boolean;
  responsibleOptions: ResponsibleOption[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/masters/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        responsibleUserId: String(fd.get("responsibleUserId")),
        source: String(fd.get("source") || "") || null,
        notes: String(fd.get("notes") || "") || null,
        status: String(fd.get("status")),
      }),
    });
    if (!res.ok) {
      setMessage("No se pudo guardar.");
      return;
    }
    setMessage("Prospecto actualizado.");
    router.refresh();
  }

  async function convert() {
    if (!confirm("¿Convertir este prospecto a cliente nuevo?")) return;
    setMessage(null);
    const res = await fetch(
      `/api/masters/prospects/${prospect.id}/convert`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "No se pudo convertir.");
      return;
    }
    router.push(`/comercial/clientes/${data.clientId}`);
    router.refresh();
  }

  const locked =
    prospect.status === "CONVERTIDO" || prospect.status === "DESCARTADO";

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {message}
        </p>
      )}
      {convertedClientId && (
        <p className="text-sm text-slate-600">
          Cliente vinculado:{" "}
          <Link
            href={`/comercial/clientes/${convertedClientId}`}
            className="font-medium text-sky-800 hover:underline"
          >
            {convertedClientName}
          </Link>
        </p>
      )}
      <form onSubmit={save} className="space-y-4 rounded-xl border bg-white p-6">
        <p className="text-sm text-slate-500">
          Responsable: <strong>{responsibleName}</strong>
        </p>
        <label className="block text-sm">
          Nombre
          <input
            name="name"
            defaultValue={prospect.name}
            required
            disabled={locked}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
          />
        </label>
        <label className="block text-sm">
          Responsable
          <select
            name="responsibleUserId"
            defaultValue={prospect.responsibleUserId}
            disabled={locked}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {responsibleOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Estado
          <select
            name="status"
            defaultValue={prospect.status}
            disabled={prospect.status === "CONVERTIDO"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Fuente
          <input
            name="source"
            defaultValue={prospect.source ?? ""}
            disabled={locked}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Notas
          <textarea
            name="notes"
            rows={4}
            defaultValue={prospect.notes ?? ""}
            disabled={locked}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {!locked && (
          <button
            type="submit"
            className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white"
          >
            Guardar
          </button>
        )}
      </form>
      {canConvert &&
        prospect.status !== "CONVERTIDO" &&
        prospect.status !== "DESCARTADO" && (
          <button
            type="button"
            onClick={convert}
            className="rounded-lg border border-sky-600 px-4 py-2 text-sm font-medium text-sky-800"
          >
            Convertir a cliente nuevo
          </button>
        )}
    </div>
  );
}
