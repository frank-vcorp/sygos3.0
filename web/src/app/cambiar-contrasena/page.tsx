import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { SygosLogo } from "@/components/brand/sygos-logo";
import { getAuthContext } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function CambiarContrasenaPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!auth.mustChangePassword) redirect("/inicio");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <SygosLogo className="mb-6" />
        <h1 className="text-xl font-semibold text-slate-900">
          Cambia tu contraseña
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Por seguridad debes definir una nueva contraseña antes de continuar.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
