"use client";

import { useEffect, useState } from "react";

type EquiRow = { id: string; folio: string; clientName: string; model: string | null };

export function QuoteEquipmentSection(props: {
  clientId: string;
  companyIsSystron: boolean;
  canQuickCreateEqui: boolean;
  quoteType: string;
  equiId: string;
  onEquiIdChange: (id: string) => void;
  prelimType: string;
  prelimBrand: string;
  prelimModel: string;
  prelimSerial: string;
  onPrelimTypeChange: (v: string) => void;
  onPrelimBrandChange: (v: string) => void;
  onPrelimModelChange: (v: string) => void;
  onPrelimSerialChange: (v: string) => void;
}) {
  const showEqui =
    props.companyIsSystron &&
    props.quoteType !== "SERVICIO_CAMPO";

  const [mode, setMode] = useState<"prelim" | "existing" | "quick">("prelim");
  const [search, setSearch] = useState("");
  const [equiRows, setEquiRows] = useState<EquiRow[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [typeName, setTypeName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!showEqui || !props.clientId || mode !== "existing") return;
    const q = search.trim();
    const url = new URL("/api/assets/equi", window.location.origin);
    url.searchParams.set("clientId", props.clientId);
    if (q.length >= 1) url.searchParams.set("q", q);
    fetch(url.toString())
      .then((r) => (r.ok ? r.json() : { equi: [] }))
      .then((data) => {
        setEquiRows(
          (data.equi ?? []).map(
            (e: {
              id: string;
              folio: string;
              clientName: string;
              model: string | null;
            }) => ({
              id: e.id,
              folio: e.folio,
              clientName: e.clientName,
              model: e.model,
            }),
          ),
        );
      });
  }, [props.clientId, search, mode, showEqui]);

  if (!showEqui) {
    return null;
  }

  function pick(e: EquiRow) {
    props.onEquiIdChange(e.id);
    setSelectedLabel(`${e.folio} · ${e.model ?? ""}`.trim());
  }

  async function createQuick(e: React.FormEvent) {
    e.preventDefault();
    if (!props.canQuickCreateEqui || !props.clientId) return;
    if (!typeName.trim() || !brandName.trim() || !model.trim()) {
      setQuickError("Tipo, marca y modelo son obligatorios para el EQUI.");
      return;
    }
    setCreating(true);
    setQuickError(null);
    const res = await fetch("/api/assets/equi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: props.clientId,
        typeName: typeName.trim(),
        brandName: brandName.trim(),
        model: model.trim(),
        serialNumber: serial.trim() || undefined,
      }),
    });
    setCreating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setQuickError(data.error ?? "No se pudo crear el EQUI.");
      return;
    }
    const data = await res.json();
    pick({
      id: data.equi.id,
      folio: data.equi.folio ?? "EQUI",
      clientName: "",
      model: model.trim(),
    });
    setMode("existing");
  }

  return (
    <fieldset className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <legend className="px-1 text-sm font-medium text-slate-800">Equipo (EQUI)</legend>
      <p className="text-xs text-slate-600">
        Discovery §3.3: elige un EQUI del cliente, créalo con alta rápida, o indica que aún no ingresa
        (solo datos preliminares).
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        {(
          [
            ["prelim", "Aún no ingresa (preliminar)"],
            ["existing", "EQUI existente"],
            ["quick", "Alta rápida EQUI"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              if (id === "prelim") {
                props.onEquiIdChange("");
                setSelectedLabel("");
              }
            }}
            className={
              mode === id
                ? "rounded-lg bg-sygos-navy px-3 py-1.5 text-white"
                : "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "prelim" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder="Tipo equipo preliminar"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={props.prelimType}
            onChange={(e) => props.onPrelimTypeChange(e.target.value)}
          />
          <input
            placeholder="Marca"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={props.prelimBrand}
            onChange={(e) => props.onPrelimBrandChange(e.target.value)}
          />
          <input
            placeholder="Modelo"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={props.prelimModel}
            onChange={(e) => props.onPrelimModelChange(e.target.value)}
          />
          <input
            placeholder="Serial (si se conoce)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={props.prelimSerial}
            onChange={(e) => props.onPrelimSerialChange(e.target.value)}
          />
        </div>
      )}

      {mode === "existing" && props.clientId && (
        <div className="space-y-2">
          {selectedLabel && (
            <p className="text-xs font-medium text-sygos-teal">Seleccionado: {selectedLabel}</p>
          )}
          <input
            type="search"
            placeholder="Buscar folio o modelo del cliente"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="max-h-36 overflow-auto rounded-lg border border-slate-200 bg-white text-sm">
            {equiRows.length === 0 && (
              <li className="px-3 py-2 text-slate-500">Sin EQUI para este cliente.</li>
            )}
            {equiRows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() => pick(row)}
                >
                  {row.folio} · {row.model ?? "—"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mode === "quick" && props.canQuickCreateEqui && (
        <form onSubmit={createQuick} className="space-y-2">
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Tipo *"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Marca *"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Modelo *"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Serial fabricante (opcional)"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
          />
          {quickError && <p className="text-xs text-red-600">{quickError}</p>}
          <button
            type="submit"
            disabled={creating || !props.clientId}
            className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            Crear EQUI y vincular a la cotización
          </button>
        </form>
      )}

      {mode === "quick" && !props.canQuickCreateEqui && (
        <p className="text-xs text-amber-800">Tu rol no puede crear EQUI.</p>
      )}
    </fieldset>
  );
}
