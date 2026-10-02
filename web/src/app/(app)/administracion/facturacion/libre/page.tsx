import { redirect } from "next/navigation";
import { FreeInvoiceForm } from "@/components/billing/free-invoice-form";
import { listClients } from "@/server/masters/clients";
import { getAuthContext } from "@/server/auth/session";
import { canEmitFiscalDocument } from "@/server/rbac/billing";

export const dynamic = "force-dynamic";

export default async function FacturaLibrePage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!canEmitFiscalDocument(auth.effective.role)) redirect("/inicio");

  const clients = await listClients({ companyId: auth.activeCompany.id });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Factura libre</h1>
      <FreeInvoiceForm
        clients={clients.map((c) => ({ id: c.id, legalName: c.legalName }))}
      />
    </div>
  );
}
