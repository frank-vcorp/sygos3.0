"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Hit = {
  type: string;
  id: string;
  label: string;
  sublabel: string | null;
  href: string;
};

const typeLabels: Record<string, string> = {
  client: "Cliente",
  prospect: "Prospecto",
  supplier: "Proveedor",
};

export function GlobalSearch({ enabled }: { enabled: boolean }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      setLoading(false);
      if (!res.ok) {
        setHits([]);
        return;
      }
      const data = await res.json();
      setHits(data.hits ?? []);
      setOpen(true);
    }, 280);
    return () => clearTimeout(t);
  }, [q, enabled]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-md flex-1 basis-full sm:basis-auto">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder={
          enabled
            ? "Buscar clientes, prospectos, proveedores…"
            : "Búsqueda global (CEO/Admin)"
        }
        disabled={!enabled}
        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-sygos-teal focus:ring-1 focus:ring-sygos-teal/30 disabled:bg-slate-50 disabled:text-slate-400"
      />
      {enabled && open && (hits.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {loading && (
            <p className="px-3 py-2 text-xs text-slate-500">Buscando…</p>
          )}
          {!loading && hits.length === 0 && q.trim().length >= 2 && (
            <p className="px-3 py-2 text-xs text-slate-500">Sin resultados.</p>
          )}
          {hits.map((h) => (
            <Link
              key={`${h.type}-${h.id}`}
              href={h.href}
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              className="block px-3 py-2 hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-900">{h.label}</p>
              <p className="text-xs text-slate-500">
                {typeLabels[h.type] ?? h.type}
                {h.sublabel ? ` · ${h.sublabel}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
