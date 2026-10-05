import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";
import {
  canManageCompanySettings,
  canManageUsers,
} from "@/server/rbac/users-admin";

export const dynamic = "force-dynamic";

export default async function ConfiguracionHubPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const links: { href: string; label: string; desc: string }[] = [];
  if (canManageCompanySettings(auth.actor.role) && !auth.viewAsActive) {
    links.push({
      href: "/configuracion/general",
      label: "General",
      desc: "§11.1 — parámetros y capacidades por empresa.",
    });
  }
  if (canManageUsers(auth.actor.role)) {
    links.push({
      href: "/configuracion/usuarios",
      label: "Usuarios",
      desc: "Roles, permisos y límites (p. ej. descuento vendedor).",
    });
  }
  links.push(
    {
      href: "/configuracion/integraciones",
      label: "Integraciones",
      desc: "§11.2 — Facturapi, correo, WhatsApp configurables.",
    },
    {
      href: "/configuracion/modo-pruebas",
      label: "Modo de pruebas",
      desc: "§11.3 — UAT sin efectos fiscales reales.",
    },
    {
      href: "/configuracion/uat-recorridos",
      label: "Recorridos UAT (R-01…R-22)",
      desc: "Sign-off discovery funcional por journeys, no solo pantallas.",
    },
  );

  if (links.length === 0) redirect("/inicio");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <p className="text-sm text-slate-600">Fase 9 discovery — producto, usuarios e integraciones.</p>
      <ul className="divide-y rounded-xl border bg-white shadow-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block px-4 py-4 hover:bg-slate-50">
              <p className="text-sm font-medium text-sygos-teal">{l.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{l.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
