"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuoteContactPicker } from "@/components/commercial/quote-contact-picker";

export function QuoteWorkflowPanel(props: {
  quoteId: string;
  clientId: string;
  status: string;
  quoteOrigin: string;
  canPrice: boolean;
  canFollowUp: boolean;
  vendorDiscountLimitPct: number | null;
  unlimitedDiscount: boolean;
  initialRecipientIds: string[];
  sentAt: Date | string | null;
}) {
  const router = useRouter();
  const [subtotal, setSubtotal] = useState("");
  const [repairBase, setRepairBase] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>(
    props.initialRecipientIds,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const showRepairBase = props.quoteOrigin === "REPARACION_TERMINADA";

  async function assignPrice() {
    setActionError(null);
    const res = await fetch(`/api/commercial/quotes/${props.quoteId}/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subtotalMxn: Number(subtotal),
        repairBaseMxn: repairBase ? Number(repairBase) : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error ?? "No se pudo asignar el precio.");
      return;
    }
    router.refresh();
  }

  async function decision(authorized: boolean) {
    setActionError(null);
    const res = await fetch(`/api/commercial/quotes/${props.quoteId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorized }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error ?? "No se pudo registrar la decisión.");
      return;
    }
    router.refresh();
  }

  async function sendQuote() {
    setActionError(null);
    if (selectedContacts.length === 0) {
      setActionError("Selecciona al menos un contacto destinatario.");
      return;
    }
    const res = await fetch(`/api/commercial/quotes/${props.quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        contactIds: selectedContacts,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error ?? "No se pudo registrar el envío.");
      return;
    }
    router.refresh();
  }

  async function applyDiscount() {
    setActionError(null);
    const res = await fetch(`/api/commercial/quotes/${props.quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "discount",
        discountPct: Number(discountPct),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(
        data.error === "Descuento fuera de límite."
          ? "El descuento supera tu máximo configurado."
          : (data.error ?? "No se pudo aplicar el descuento."),
      );
      return;
    }
    router.refresh();
  }

  if (props.status === "PENDIENTE_COTIZAR" && !props.canPrice) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Sin precio todavía</p>
        <p className="mt-1">
          CEO/Administrador asignará el precio en la bandeja{" "}
          <Link href="/comercial/cotizaciones?vista=pendientes-cotizar" className="text-sygos-teal">
            Pendientes de cotizar
          </Link>
          . Como vendedor no capturas ni editas importes.
        </p>
      </section>
    );
  }

  if (props.status !== "PENDIENTE_COTIZAR" && props.status !== "PENDIENTE_DECISION") {
    return null;
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {props.status === "PENDIENTE_COTIZAR" && props.canPrice && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Asignar precio</h2>
          <p className="mt-1 text-xs text-slate-500">
            CEO/Administrador — pasa a pendiente de decisión para seguimiento comercial.
          </p>
          <div className="mt-4 space-y-2">
            {showRepairBase && (
              <>
                <label className="block text-sm">
                  Base reparación (MXN, antes de incremento congelado)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={repairBase}
                    onChange={(e) => setRepairBase(e.target.value)}
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Si capturas base, el subtotal final se calcula con el incremento de prioridad
                  congelado de la reparación.
                </p>
              </>
            )}
            <label className="block text-sm">
              Subtotal MXN (antes de IVA)
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                placeholder={showRepairBase ? "Opcional si usas base" : "Requerido"}
              />
            </label>
            <button
              type="button"
              onClick={assignPrice}
              disabled={!subtotal && !repairBase}
              className="rounded-lg bg-sygos-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Fijar precio → Pendiente de decisión
            </button>
          </div>
        </section>
      )}

      {props.status === "PENDIENTE_DECISION" && props.canFollowUp && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Envío y destinatarios</h2>
            <p className="mt-1 text-xs text-slate-500">
              Selecciona contactos del cliente para el envío (obligatorio al registrar envío).
            </p>
            {props.sentAt && (
              <p className="mt-2 text-xs text-emerald-800">
                Último envío registrado:{" "}
                {new Date(props.sentAt).toLocaleString("es-MX", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            )}
            <div className="mt-3">
              <QuoteContactPicker
                clientId={props.clientId}
                selectedIds={selectedContacts}
                onSelectedIdsChange={setSelectedContacts}
              />
            </div>
            <button
              type="button"
              onClick={sendQuote}
              className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Registrar envío
            </button>
            <p className="mt-2 text-xs text-slate-500">
              ¿Faltan contactos?{" "}
              <Link href={`/comercial/clientes/${props.clientId}`} className="text-sygos-teal">
                Abrir ficha del cliente
              </Link>
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Descuento comercial</h2>
            {!props.unlimitedDiscount && props.vendorDiscountLimitPct != null && (
              <p className="mt-1 text-xs text-slate-500">
                Tu máximo individual: {props.vendorDiscountLimitPct}%.
              </p>
            )}
            {props.unlimitedDiscount && (
              <p className="mt-1 text-xs text-slate-500">Sin límite de descuento (CEO/Admin).</p>
            )}
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-sm">
                % descuento
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="ml-2 w-24 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={applyDiscount}
                disabled={discountPct === ""}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                Aplicar descuento
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Decisión del cliente</h2>
            <p className="mt-1 text-xs text-slate-500">
              Registra si el cliente autorizó o rechazó la cotización.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => decision(true)}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
              >
                Autorizada
              </button>
              <button
                type="button"
                onClick={() => decision(false)}
                className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white"
              >
                No autorizada
              </button>
            </div>
          </section>
        </>
      )}

      {props.status === "PENDIENTE_DECISION" && !props.canFollowUp && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          El seguimiento, envío y decisión corresponden al vendedor o gerente comercial de la
          empresa.
        </section>
      )}
    </div>
  );
}
