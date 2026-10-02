import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoViewAsUsers } from "@/server/setup/demo-view-as-users";

const bodySchema = z.object({
  setupKey: z.string().min(8),
  password: z.string().min(10),
});

/** Provisiona usuarios QA (un rol cada uno) para «Ver como». Requiere SETUP_BOOTSTRAP_KEY. */
export async function POST(request: Request) {
  const expected = process.env.SETUP_BOOTSTRAP_KEY;
  if (!expected) {
    return NextResponse.json({ error: "Bootstrap deshabilitado." }, { status: 404 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    if (body.setupKey !== expected) {
      return NextResponse.json({ error: "Clave inválida." }, { status: 403 });
    }
    const result = await ensureDemoViewAsUsers(body.password);
    return NextResponse.json({
      ok: true,
      message:
        "Usuarios QA listos. Entra como Systronia y usa «Ver como» en el header.",
      ...result,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    if (msg === "COMPANIES_MISSING_RUN_SEED") {
      return NextResponse.json(
        { error: "Ejecute db:seed antes (empresas faltantes)." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
}
