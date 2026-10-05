import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/session";
import { canManageCompanySettings } from "@/server/rbac/users-admin";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    title: "Multiempresa",
    items: [
      "SYSTRON y Servomotores no mezclan clientes, finanzas ni reportes.",
      "Cambio explícito de empresa activa.",
      "MOT con folio global compartido.",
    ],
  },
  {
    title: "MOT intercompañía",
    items: [
      "Ingreso pendiente en Servomotores.",
      "SLA al ingresar.",
      "SYSTRON lee bitácora en solo lectura.",
      "Factura intercompañía crea CxC/CxP espejo.",
      "Pago real liquida sin movimiento ficticio.",
    ],
  },
  {
    title: "Operación técnica",
    items: [
      "Diagnóstico terminado → validación gerente.",
      "Devuelto a corrección con motivo.",
      "Validado → pendientes de cotizar cuando aplica.",
      "Refacciones mantienen OS en espera.",
    ],
  },
  {
    title: "Fiscal e integraciones",
    items: [
      "Sin Facturapi configurada: no simular éxito en producción.",
      "Staging UAT: SYGOS_INTERNAL_FISCAL=1 (ver docs/STAGING-UAT.md).",
      "Modo de pruebas: simulación PRUEBA / SIN VALIDEZ.",
      "Error fiscal permite reintento sin duplicar (idempotency key).",
      "Integraciones habilitadas sin credenciales muestran aviso.",
    ],
  },
  {
    title: "Personal",
    items: [
      "Vacaciones: origen jefe, autorización CEO/Admin.",
      "Horas extra: jefe → CEO.",
      "Nómina autorizada no se reabre.",
      "Gerente SM excluido de conceptos laborales excluidos.",
    ],
  },
];

export default async function CierreE2EPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canManageCompanySettings(auth.actor.role)) redirect("/inicio");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/configuracion/general" className="text-sm text-sygos-teal">
        ← Configuración
      </Link>
      <h1 className="text-2xl font-semibold">Checklist cierre E2E (Discovery §12)</h1>
      <p className="text-sm text-slate-600">
        Validación manual extremo a extremo. Inventario técnico §12:{" "}
        <code className="text-xs">web/docs/DISCOVERY-12-CHECKLIST.md</code>.
        La aceptación de negocio es ejecutar los{" "}
        <Link href="/configuracion/uat-recorridos" className="text-sygos-teal underline">
          22 recorridos UAT
        </Link>{" "}
        (R-01…R-22) con roles QA — ver{" "}
        <code className="text-xs">SYGOS_3.0_PLAN_VALIDACION_FINAL.md</code>.
      </p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">{section.title}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
