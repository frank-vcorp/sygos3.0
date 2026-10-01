"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "");
    const password = String(form.get("password") ?? "");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo iniciar sesión.");
      return;
    }

    if (data.mustChangePassword) {
      router.push("/cambiar-contrasena");
      router.refresh();
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <div>
        <label
          htmlFor="usuario"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Usuario
        </label>
        <input
          id="usuario"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Systronia"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-sygos-teal/30 focus:border-sygos-teal focus:ring-2"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-sygos-teal/30 focus:border-sygos-teal focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-sygos-navy px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sygos-navy-sidebar disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Entrar al sistema"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
