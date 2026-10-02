"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
};

export function FunctionalHistoryPanel(props: {
  entityType: string;
  entityId: string;
  title?: string;
}) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    void (async () => {
      const q = new URLSearchParams({
        entityType: props.entityType,
        entityId: props.entityId,
      });
      const res = await fetch(`/api/history?${q}`);
      if (res.ok) {
        const data = (await res.json()) as { entries: Entry[] };
        setEntries(data.entries);
      }
    })();
  }, [props.entityType, props.entityId]);

  return (
    <section className="rounded-xl border bg-white p-4">
      <h2 className="text-sm font-semibold">
        {props.title ?? "Historial funcional"}
      </h2>
      <ul className="mt-2 divide-y text-sm">
        {entries.length === 0 && (
          <li className="py-2 text-slate-500">Sin eventos registrados.</li>
        )}
        {entries.map((e) => (
          <li key={e.id} className="py-2">
            <p className="font-medium">{e.action}</p>
            {e.detail && <p className="text-slate-600">{e.detail}</p>}
            <p className="text-xs text-slate-500">
              {new Date(e.createdAt).toLocaleString("es-MX")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
