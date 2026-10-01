import Link from "next/link";
import { redirect } from "next/navigation";
import { MotorCreateForm } from "@/components/assets/asset-forms";
import type { CompanySlug } from "@/lib/company";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import { canCreateMotor } from "@/server/rbac/assets";

export const dynamic = "force-dynamic";

export default async function NuevoMotPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  const slug = auth.activeCompany.slug as CompanySlug;
  if (!canCreateMotor(auth.effective.role, slug)) redirect("/activos/mot");

  const clients = await listClients({ companyId: auth.activeCompany.id });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/activos/mot" className="text-sm text-sky-800 hover:underline">
        ← MOT
      </Link>
      <h1 className="text-2xl font-semibold">Nuevo MOT</h1>
      {slug === "SYSTRON" && (
        <p className="text-sm text-amber-900 rounded-lg bg-amber-50 px-3 py-2">
          MOT SYSTRON no pasa por almacén SYSTRON; Servomotores recibirá pendiente de ingreso físico.
        </p>
      )}
      <MotorCreateForm clients={clients.map((c) => ({ id: c.id, legalName: c.legalName }))} />
    </div>
  );
}
