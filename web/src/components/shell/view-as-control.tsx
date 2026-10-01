"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ViewAsUser = { id: string; label: string };

type ViewAsControlProps = {
  enabled: boolean;
  viewAsActive: boolean;
  currentLabel: string;
};

export function ViewAsControl({
  enabled,
  viewAsActive,
  currentLabel,
}: ViewAsControlProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ViewAsUser[]>([]);

  useEffect(() => {
    if (!enabled) return;
    fetch("/api/view-as/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]));
  }, [enabled]);

  if (!enabled) return null;

  async function selectUser(userId: string | null) {
    setOpen(false);
    if (userId === null) {
      await fetch("/api/view-as/stop", { method: "POST" });
    } else {
      await fetch("/api/view-as/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
    }
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600"
      >
        Ver como
        <ChevronDown className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-800">{currentLabel}</span>
      </button>
      {open && (
        <ul className="absolute right-0 z-50 mt-1 max-h-64 w-72 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <li>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => selectUser(null)}
            >
              Yo (admin)
            </button>
          </li>
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => selectUser(u.id)}
              >
                {u.label}
              </button>
            </li>
          ))}
          {viewAsActive && (
            <li className="border-t border-slate-100">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm font-medium text-sygos-teal hover:bg-slate-50"
                onClick={() => selectUser(null)}
              >
                Salir de Ver como
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
