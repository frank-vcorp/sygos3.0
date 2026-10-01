"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirm) {
      setError("La nueva contraseña no coincide.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo actualizar la contraseña.");
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">Contraseña actual</label>
        <input
          name="currentPassword"
          type="password"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Nueva contraseña</label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={10}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">Mínimo 10 caracteres.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Confirmar nueva</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-sygos-navy py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Guardando…" : "Guardar y continuar"}
      </button>
    </form>
  );
}
