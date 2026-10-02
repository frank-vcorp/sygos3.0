"use client";

import { useEffect, useState } from "react";

type ClientRow = { id: string; legalName: string };

export function ClientPickerQuick(props: {
  initialClients: ClientRow[];
  canQuickCreate: boolean;
  clientId: string;
  onClientIdChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ClientRow[]>(props.initialClients);
  const [selectedLabel, setSelectedLabel] = useState<string>(() => {
    const hit = props.initialClients.find((c) => c.id === props.clientId);
    return hit?.legalName ?? "";
  });
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickContact, setQuickContact] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults(props.initialClients);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/masters/clients?q=${encodeURIComponent(term)}`);
      if (!res.ok) return;
      const data = await res.json();
      setResults(
        (data.clients ?? []).map((c: { id: string; legalName: string }) => ({
          id: c.id,
          legalName: c.legalName,
        })),
      );
    }, 250);
    return () => clearTimeout(t);
  }, [search, props.initialClients]);

  function pick(client: ClientRow) {
    props.onClientIdChange(client.id);
    setSelectedLabel(client.legalName);
    setSearch("");
    setQuickOpen(false);
    setQuickError(null);
  }

  async function createQuick(e: React.FormEvent) {
    e.preventDefault();
    if (!props.canQuickCreate) return;
    const legalName = quickName.trim();
    if (!legalName) {
      setQuickError("Indica la razón social.");
      return;
    }
    setCreating(true);
    setQuickError(null);
    const res = await fetch("/api/masters/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName,
        requiresInvoice: false,
        primaryContact: quickContact.trim()
          ? { name: quickContact.trim() }
          : undefined,
      }),
    });
    setCreating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setQuickError(data.error ?? "No se pudo crear el cliente.");
      return;
    }
    const data = await res.json();
    pick({ id: data.client.id, legalName: data.client.legalName });
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        Cliente
        <p className="mt-0.5 text-xs font-normal text-slate-500">
          Busca antes de crear (alta rápida). Datos fiscales pueden completarse después.
        </p>
        {selectedLabel && (
          <p className="mt-1 text-xs font-medium text-sygos-teal">
            Seleccionado: {selectedLabel}
          </p>
        )}
        <input
          type="search"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Razón social o RFC (mín. 2 caracteres)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {search.trim().length >= 2 && (
        <ul className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white text-sm">
          {results.length === 0 && (
            <li className="px-3 py-2 text-slate-500">Sin coincidencias.</li>
          )}
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => pick(c)}
              >
                {c.legalName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {props.canQuickCreate && (
        <div>
          {!quickOpen ? (
            <button
              type="button"
              className="text-sm font-medium text-sygos-teal underline"
              onClick={() => {
                setQuickOpen(true);
                setQuickName(search.trim());
                setQuickError(null);
              }}
            >
              Alta rápida de cliente
            </button>
          ) : (
            <form
              onSubmit={createQuick}
              className="mt-2 space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3"
            >
              <p className="text-xs font-medium text-slate-700">Alta rápida</p>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Razón social *"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                required
              />
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Contacto principal (opcional)"
                value={quickContact}
                onChange={(e) => setQuickContact(e.target.value)}
              />
              {quickError && <p className="text-xs text-red-600">{quickError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-sygos-navy px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                >
                  Crear y usar
                </button>
                <button
                  type="button"
                  className="text-xs text-slate-600 underline"
                  onClick={() => setQuickOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <input type="hidden" name="clientId" value={props.clientId} required readOnly />
    </div>
  );
}
