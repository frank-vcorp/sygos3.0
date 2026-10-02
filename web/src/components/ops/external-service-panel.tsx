"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExternalServicePanel(props: {
  diagnosticId: string;
  equiId: string | null | undefined;
  suppliers: { id: string; legalName: string }[];
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [ref, setRef] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!props.equiId || props.suppliers.length === 0) return null;

  return (
    <section className="rounded-xl border bg-white p-4 text-sm">
      <h2 className="font-semibold">Servicio externo / maquila</h2>
      <p className="mt-1 text-slate-600">
        Registra salida a proveedor, retorno y obligación económica vinculada al diagnóstico.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="min-w-[12rem] rounded border px-2 py-1"
        >
          <option value="">Proveedor…</option>
          {props.suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.legalName}
            </option>
          ))}
        </select>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Ref. documento proveedor"
          className="min-w-[10rem] rounded border px-2 py-1"
        />
        <button
          type="button"
          className="rounded bg-sygos-navy px-3 py-1 text-white"
          onClick={async () => {
            setMessage(null);
            const res = await fetch(
              `/api/ops/diagnostics/${props.diagnosticId}/external-service`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "send",
                  supplierId,
                  vendorDocumentRef: ref || undefined,
                }),
              },
            );
            if (!res.ok) {
              setMessage("No se pudo registrar salida.");
              return;
            }
            router.refresh();
          }}
        >
          Enviar a proveedor
        </button>
      </div>
      {message && <p className="mt-2 text-red-700">{message}</p>}
    </section>
  );
}
