"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UatRecorrido } from "@/lib/discovery/uat-recorridos";

const STORAGE_KEY = "sygos-uat-recorridos-v1";

function loadState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      boolean
    >;
  } catch {
    return {};
  }
}

export function UatRecorridosChecklist(props: { recorridos: UatRecorrido[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDone(loadState());
  }, []);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const nucleo = props.recorridos.filter((r) => r.priority === "nucleo");
  const rest = props.recorridos.filter((r) => r.priority === "secundario");
  const passed = props.recorridos.filter((r) => done[r.id]).length;
  const total = props.recorridos.length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Progreso local: {passed}/{total} recorridos marcados OK. La aceptación funcional
        requiere ejecutar cada guion con roles QA (Ver como) y anotar folios en{" "}
        <code className="text-xs">SYGOS_3.0_PLAN_VALIDACION_FINAL.md</code>.
      </p>
      <Section title="Núcleo (prioridad UAT)" items={nucleo} done={done} onToggle={toggle} />
      <Section title="Secundarios" items={rest} done={done} onToggle={toggle} />
    </div>
  );
}

function Section(props: {
  title: string;
  items: UatRecorrido[];
  done: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">{props.title}</h2>
      <ul className="divide-y">
        {props.items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start gap-3 px-4 py-3 text-sm">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(props.done[r.id])}
                onChange={() => props.onToggle(r.id)}
              />
              <span>
                <span className="font-medium text-slate-900">
                  {r.id} · {r.title}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {r.discovery} · {r.roles}
                </span>
              </span>
            </label>
            <Link
              href={r.startHref}
              className="ml-auto shrink-0 rounded border border-sygos-teal/30 px-2 py-1 text-xs text-sygos-teal hover:bg-teal-50"
            >
              Iniciar recorrido →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
