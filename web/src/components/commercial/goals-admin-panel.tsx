"use client";

import { useState } from "react";

export function GoalsAdminPanel(props: {
  goalTypes: { id: string; label: string; code: string }[];
  users: { id: string; displayName: string }[];
}) {
  const [userId, setUserId] = useState(props.users[0]?.id ?? "");
  const [goalTypeId, setGoalTypeId] = useState(props.goalTypes[0]?.id ?? "");
  const [targetValue, setTargetValue] = useState("5");
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date();
    const res = await fetch("/api/commercial/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        goalTypeId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        targetValue: Number(targetValue),
      }),
    });
    setMessage(res.ok ? "Meta guardada para el mes actual." : "Error al guardar.");
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <label className="block text-sm">
        Vendedor
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          {props.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Tipo de meta
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={goalTypeId}
          onChange={(e) => setGoalTypeId(e.target.value)}
        >
          {props.goalTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Objetivo (mes en curso)
        <input
          type="number"
          min={0}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
        />
      </label>
      <button type="submit" className="rounded-lg bg-sygos-navy px-4 py-2 text-sm text-white">
        Guardar meta
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}
