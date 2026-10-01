import { NextResponse } from "next/server";
import { z } from "zod";
import { addClientContact } from "@/server/masters/clients";
import { getMastersSession } from "@/server/masters/auth";
import { canSeeClients } from "@/server/rbac/masters";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  email: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await getMastersSession();
  if (!auth || !canSeeClients(auth.effectiveRole)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const contact = await addClientContact({
      clientId: id,
      companyId: auth.activeCompany.id,
      ...body,
    });
    if (!contact) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
