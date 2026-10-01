import Link from "next/link";
import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { SygosLogo } from "@/components/brand/sygos-logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative flex flex-1 flex-col justify-between bg-sygos-navy px-8 py-10 text-white lg:px-12 lg:py-14">
        <SygosLogo variant="light" />
        <div className="my-12 max-w-md space-y-6">
          <p className="text-xs font-semibold tracking-widest text-sygos-teal-light">
            OPERACIÓN CONECTADA
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Claridad para decidir. Control para crecer.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Gestión integral para SYSTRON y Servomotores, con trazabilidad,
            permisos y operación en tiempo real.
          </p>
          <ul className="space-y-3 text-sm text-slate-200">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-sygos-teal-light" />
              Acceso seguro por rol
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-sygos-teal-light" />
              Procesos trazables
            </li>
            <li className="flex items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-sygos-teal-light" />
              Operación multiempresa
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-500">SYGOS 3.0 · Plataforma empresarial</p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500">
            BIENVENIDO
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Inicia sesión
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Accede a tu espacio de trabajo operativo.
          </p>

          <LoginForm />

          <p className="mt-6 text-center text-xs text-slate-400">
            <Link href="/login" className="hover:text-sygos-teal">
              Volver al inicio
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
