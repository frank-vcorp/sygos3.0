import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { ContextBanners } from "@/components/shell/context-banners";
import type { ActiveCompany } from "@/lib/nav";

/** Placeholder Fase 1 — sesión real después */
const mockSession = {
  userName: "Systronia",
  userRole: "ADMINISTRADOR",
  activeCompany: "SYSTRON" as ActiveCompany,
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userName, userRole, activeCompany } = mockSession;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AppSidebar activeCompany={activeCompany} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          workspaceLabel={`Espacio de trabajo ${activeCompany}`}
          activeCompany={activeCompany}
          userName={userName}
          userRole={userRole}
        />
        <ContextBanners activeCompany={activeCompany} />
        <main className="relative flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
