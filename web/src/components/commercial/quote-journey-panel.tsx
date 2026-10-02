"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { JourneyPanel } from "@/components/journey/journey-panel";
import type { JourneyHint } from "@/server/journey/types";

export function QuoteJourneyPanel(props: {
  quoteId: string;
  status: string;
  hint: JourneyHint | null;
  clientId: string;
  canLinkAsset: boolean;
  equiOptions: { id: string; label: string }[];
  motorOptions: { id: string; label: string }[];
  quoteType: string;
  lineIds: { id: string; concept: string; lineAuthorized: boolean | null }[];
  canDecide: boolean;
}) {
  const router = useRouter();
  const [equiId, setEquiId] = useState("");
  const [motorId, setMotorId] = useState("");
  const [selectedLines, setSelectedLines] = useState<string[]>(
    props.lineIds.filter((l) => !l.lineAuthorized).map((l) => l.id),
  );

  async function linkAsset() {
    await fetch(`/api/commercial/quotes/${props.quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "link_asset",
        equiId: equiId || undefined,
        motorId: motorId || undefined,
      }),
    });
    router.refresh();
  }

  async function authorizePartial() {
    await fetch(`/api/commercial/quotes/${props.quoteId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorized: true,
        authorizedLineIds: selectedLines,
      }),
    });
    router.refresh();
  }

  return (
    <JourneyPanel hint={props.hint}>
      {props.status === "AUTORIZADA_PENDIENTE_INGRESO" && props.canLinkAsset && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-amber-800">
            Vincule el EQUI o MOT recibido; luego confirme entrada en Almacén para iniciar técnica/OS.
          </p>
          {props.equiOptions.length > 0 && (
            <select
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2"
              value={equiId}
              onChange={(e) => setEquiId(e.target.value)}
            >
              <option value="">— EQUI —</option>
              {props.equiOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          )}
          {props.motorOptions.length > 0 && (
            <select
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2"
              value={motorId}
              onChange={(e) => setMotorId(e.target.value)}
            >
              <option value="">— MOT —</option>
              {props.motorOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
          <Link
            href={`/activos/equi/nuevo?clientId=${props.clientId}`}
            className="text-xs text-sygos-teal underline"
          >
            Crear EQUI para este cliente
          </Link>
          <button
            type="button"
            onClick={linkAsset}
            disabled={!equiId && !motorId}
            className="rounded-lg bg-sygos-navy px-3 py-2 text-white disabled:opacity-50"
          >
            Vincular equipo a cotización
          </button>
        </div>
      )}

      {props.status === "PENDIENTE_DECISION" &&
        props.quoteType === "VENTA_EQUIPO" &&
        props.canDecide &&
        props.lineIds.length > 1 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-amber-800">Autorización parcial por línea (venta de equipo):</p>
            {props.lineIds.map((l) => (
              <label key={l.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedLines.includes(l.id)}
                  disabled={l.lineAuthorized === true}
                  onChange={(e) => {
                    setSelectedLines((prev) =>
                      e.target.checked
                        ? [...prev, l.id]
                        : prev.filter((id) => id !== l.id),
                    );
                  }}
                />
                {l.concept}
                {l.lineAuthorized && " (ya autorizada)"}
              </label>
            ))}
            <button
              type="button"
              onClick={authorizePartial}
              disabled={selectedLines.length === 0}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-white disabled:opacity-50"
            >
              Autorizar líneas seleccionadas
            </button>
          </div>
        )}
    </JourneyPanel>
  );
}
