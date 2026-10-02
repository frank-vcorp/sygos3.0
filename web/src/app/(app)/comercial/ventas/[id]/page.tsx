import { redirect } from "next/navigation";
import { SaleLineActions } from "@/components/commercial/sale-line-actions";
import { getEquipmentSaleDetail } from "@/server/commercial/sales";
import { getAuthContext } from "@/server/auth/session";
import { canSeeCommercialModule } from "@/server/rbac/commercial";
import { JourneyPanel } from "@/components/journey/journey-panel";
import { getEquipmentSaleJourneyHint } from "@/server/journey/sale-handoffs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function VentaDetallePage({ params }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canSeeCommercialModule(auth.effective.role)) redirect("/inicio");

  const { id } = await params;
  const detail = await getEquipmentSaleDetail(auth.activeCompany.id, id);
  if (!detail) redirect("/comercial/ventas");

  const hasPendingReceive = detail.lines.some(
    (l) => l.line.quantityReceived < l.line.quantitySold,
  );
  const hasPendingDelivery = detail.lines.some(
    (l) => l.line.quantityDelivered < l.line.quantityReceived,
  );
  const journeyHint = getEquipmentSaleJourneyHint({
    status: detail.sale.status,
    hasPendingReceive,
    hasPendingDelivery,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{detail.sale.folio}</h1>
      <p className="text-sm text-slate-500">Estado: {detail.sale.status}</p>
      <JourneyPanel hint={journeyHint} />
      <ul className="space-y-4">
        {detail.lines.map(({ line, concept }) => (
          <li
            key={line.id}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
          >
            <p className="font-medium">{concept}</p>
            <p className="mt-1 text-slate-600">
              Vendido: {line.quantitySold} · Recibido: {line.quantityReceived} · Entregado:{" "}
              {line.quantityDelivered}
            </p>
            <SaleLineActions saleId={id} lineId={line.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
