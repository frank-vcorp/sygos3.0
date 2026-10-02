import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OsActionsPanel } from "@/components/ops/os-panel";
import { getWorkOrder } from "@/server/assets/work-orders";
import { listBitacora } from "@/server/ops/bitacora";
import { getAuthContext } from "@/server/auth/session";
import { canSeeTechnicalOps } from "@/server/rbac/ops";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function OsDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeTechnicalOps(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getWorkOrder(auth.activeCompany.id, id);
  if (!detail) notFound();

  const entries = await listBitacora({ workOrderId: id });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/operacion/os" className="text-sm text-sky-800 hover:underline">
        ← OS
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{detail.workOrder.folio}</h1>
        <p className="text-sm text-slate-600">Estado: {detail.workOrder.repairStatus}</p>
      </div>
      <OsActionsPanel workOrderId={id} repairStatus={detail.workOrder.repairStatus} />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Solicitudes refacción</h2>
        <ul className="mt-2 divide-y text-sm">
          {detail.requests.map((r) => (
            <li key={r.id} className="py-2">
              {r.partNumber} × {r.quantityRequested} — {r.status}
            </li>
          ))}
        </ul>
        <Link href="/operacion/refacciones" className="mt-2 inline-block text-sm text-sky-800">
          Gestionar refacciones
        </Link>
      </section>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Bitácora OS</h2>
        <ul className="mt-2 divide-y text-sm">
          {entries.map((e) => (
            <li key={e.id} className="py-2">
              {e.body} — {e.authorName}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
