"use client";

import { useEffect, useState } from "react";

type Contact = {
  id: string;
  name: string;
  email: string | null;
  isPrimary: boolean | null;
};

export function QuoteContactPicker(props: {
  clientId: string;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  label?: string;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.clientId) {
      setContacts([]);
      props.onSelectedIdsChange([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/masters/clients/${props.clientId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudieron cargar contactos.");
        return res.json() as Promise<{ contacts: Contact[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        const list = data.contacts ?? [];
        setContacts(list);
        const primary = list.find((c) => c.isPrimary);
        if (primary && props.selectedIds.length === 0) {
          props.onSelectedIdsChange([primary.id]);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar contactos.");
          setContacts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preselect only when client changes
  }, [props.clientId]);

  if (!props.clientId) {
    return (
      <p className="text-xs text-slate-500">Selecciona un cliente para elegir contactos.</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">
        {props.label ?? "Contactos destinatarios"}
      </p>
      {loading && <p className="text-xs text-slate-500">Cargando contactos…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!loading && contacts.length === 0 && (
        <p className="text-xs text-amber-800">
          Este cliente no tiene contactos. Agrégalos en la ficha del cliente antes de enviar la
          cotización.
        </p>
      )}
      <ul className="space-y-1">
        {contacts.map((c) => (
          <li key={c.id}>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={props.selectedIds.includes(c.id)}
                onChange={(e) => {
                  props.onSelectedIdsChange(
                    e.target.checked
                      ? [...props.selectedIds, c.id]
                      : props.selectedIds.filter((id) => id !== c.id),
                  );
                }}
              />
              <span>
                {c.name}
                {c.isPrimary ? " (principal)" : ""}
                {c.email ? (
                  <span className="block text-xs text-slate-500">{c.email}</span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
