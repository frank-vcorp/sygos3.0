import { ModuleListTabs } from "@/components/discovery/module-list-tabs";

export function DiagnosticListTabs(props: {
  active: "todas" | "validacion" | "activos";
  showValidationTab: boolean;
}) {
  const tabs = [
    { id: "todas", label: "Todas" },
    ...(props.showValidationTab
      ? [{ id: "validacion", label: "Pendientes de validación", queryValue: "validacion" }]
      : []),
    { id: "activos", label: "En curso", queryValue: "activos" },
  ];
  return (
    <ModuleListTabs basePath="/operacion/diagnosticos" activeId={props.active} tabs={tabs} />
  );
}
