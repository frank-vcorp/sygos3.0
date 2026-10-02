"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientPickerQuick } from "@/components/commercial/client-picker-quick";
import { QuoteContactPicker } from "@/components/commercial/quote-contact-picker";
import { QuoteEquipmentSection } from "@/components/commercial/quote-equipment-section";

type Line = { concept: string; quantity: number };

const quoteTypeConceptLabel: Record<string, string> = {
  DIAGNOSTICO: "Diagnóstico",
  REPARACION_SERVICIO: "Reparación / servicio",
  SERVICIO_CAMPO: "Servicio en campo",
  VENTA_EQUIPO: "Venta de equipo",
};

function defaultConceptFromContext(params: {
  quoteType: string;
  prelimType: string;
  prelimBrand: string;
  prelimModel: string;
}): string {
  const base = quoteTypeConceptLabel[params.quoteType] ?? "Servicio solicitado";
  const parts = [params.prelimType, params.prelimBrand, params.prelimModel]
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return base;
  return `${base} — ${parts.join(" ")}`;
}

export function NewQuoteForm(props: {
  clients: { id: string; legalName: string }[];
  canQuickCreateClient?: boolean;
  companyIsSystron?: boolean;
  canQuickCreateEqui?: boolean;
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(props.clients[0]?.id ?? "");
  const [equiId, setEquiId] = useState("");
  const [quoteType, setQuoteType] = useState("SERVICIO_CAMPO");
  const [lines, setLines] = useState<Line[]>([{ concept: "", quantity: 1 }]);
  const [prelimModel, setPrelimModel] = useState("");
  const [prelimBrand, setPrelimBrand] = useState("");
  const [prelimType, setPrelimType] = useState("");
  const [prelimSerial, setPrelimSerial] = useState("");
  const [commercialReference, setCommercialReference] = useState("");
  const [complementNotes, setComplementNotes] = useState("");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      setError("Selecciona o crea un cliente.");
      return;
    }
    let validLines = lines.filter((l) => l.concept.trim());
    if (validLines.length === 0) {
      const inferred = defaultConceptFromContext({
        quoteType,
        prelimType: prelimType,
        prelimBrand: prelimBrand,
        prelimModel: prelimModel,
      });
      validLines = [{ concept: inferred, quantity: lines[0]?.quantity ?? 1 }];
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/commercial/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        quoteType,
        equiId: equiId || undefined,
        prelimEquipmentType: equiId ? undefined : prelimType || undefined,
        prelimBrand: equiId ? undefined : prelimBrand || undefined,
        prelimModel: equiId ? undefined : prelimModel || undefined,
        prelimSerial: equiId ? undefined : prelimSerial || undefined,
        commercialReference: commercialReference.trim() || undefined,
        complementNotes: complementNotes.trim() || undefined,
        contactIds: contactIds.length ? contactIds : undefined,
        lines: validLines,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo crear la cotización.");
      return;
    }
    const data = await res.json();
    router.push(`/comercial/cotizaciones/${data.quote.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ClientPickerQuick
        initialClients={props.clients}
        canQuickCreate={props.canQuickCreateClient ?? false}
        clientId={clientId}
        onClientIdChange={setClientId}
      />
      <label className="block text-sm">
        Tipo
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={quoteType}
          onChange={(e) => setQuoteType(e.target.value)}
        >
          <option value="DIAGNOSTICO">Diagnóstico</option>
          <option value="REPARACION_SERVICIO">Reparación / Servicio</option>
          <option value="SERVICIO_CAMPO">Servicio en campo</option>
          <option value="VENTA_EQUIPO">Venta de equipo</option>
        </select>
      </label>
      <QuoteEquipmentSection
        clientId={clientId}
        companyIsSystron={props.companyIsSystron ?? false}
        canQuickCreateEqui={props.canQuickCreateEqui ?? false}
        quoteType={quoteType}
        equiId={equiId}
        onEquiIdChange={setEquiId}
        prelimType={prelimType}
        prelimBrand={prelimBrand}
        prelimModel={prelimModel}
        prelimSerial={prelimSerial}
        onPrelimTypeChange={setPrelimType}
        onPrelimBrandChange={setPrelimBrand}
        onPrelimModelChange={setPrelimModel}
        onPrelimSerialChange={setPrelimSerial}
      />
      <p className="text-xs text-slate-500">
        Solo contexto comercial — <strong>no captures precio</strong>; queda en pendiente de cotizar
        para CEO/Administrador. Si dejas el concepto vacío, se arma desde tipo + equipo preliminar.
      </p>
      <label className="block text-sm font-medium text-slate-800">
        Concepto / servicio solicitado
      </label>
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ej. Diagnóstico servomotor (opcional si hay datos arriba)"
            value={line.concept}
            onChange={(e) => {
              const next = [...lines];
              next[i] = { ...line, concept: e.target.value };
              setLines(next);
            }}
          />
          <input
            type="number"
            min={1}
            className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-sm"
            value={line.quantity}
            onChange={(e) => {
              const next = [...lines];
              next[i] = { ...line, quantity: Number(e.target.value) };
              setLines(next);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-sygos-teal"
        onClick={() => setLines([...lines, { concept: "", quantity: 1 }])}
      >
        + Línea
      </button>
      <QuoteContactPicker
        clientId={clientId}
        selectedIds={contactIds}
        onSelectedIdsChange={setContactIds}
        label="Contactos destinatarios (recomendado al crear)"
      />
      <label className="block text-sm">
        Referencia comercial / PO (opcional)
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={commercialReference}
          onChange={(e) => setCommercialReference(e.target.value)}
          placeholder="Ej. OC cliente, proyecto…"
        />
      </label>
      <label className="block text-sm">
        Información complementaria (opcional)
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={2}
          value={complementNotes}
          onChange={(e) => setComplementNotes(e.target.value)}
          placeholder="Alcance, observaciones para quien cotiza…"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-sygos-navy px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        Guardar (pendiente de cotizar)
      </button>
    </form>
  );
}

export function ActivityQuickForm(props: {
  categories: { id: string; name: string }[];
  clients: { id: string; legalName: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(props.categories[0]?.id ?? "");
  const [clientId, setClientId] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/commercial/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        categoryId: categoryId || undefined,
        clientId: clientId || undefined,
        occurredAt: new Date().toISOString(),
      }),
    });
    setTitle("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <input
        className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Actividad"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <select
        className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {props.categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      >
        <option value="">Sin cliente</option>
        {props.clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.legalName}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-sygos-navy px-3 py-2 text-sm text-white"
      >
        Registrar
      </button>
    </form>
  );
}
