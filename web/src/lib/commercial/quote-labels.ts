export const quoteOriginLabel: Record<string, string> = {
  VENDEDOR: "Vendedor",
  DIAGNOSTICO_VALIDADO: "Diagnóstico validado",
  REPARACION_TERMINADA: "Reparación terminada",
  GARANTIA_COBRAR: "Garantía (cobrar)",
  MOT_BASE_SERVOMOTORES: "Base MOT Servomotores",
};

export const quoteStatusLabel: Record<string, string> = {
  PENDIENTE_COTIZAR: "Pendiente de cotizar",
  PENDIENTE_DECISION: "Pendiente de decisión",
  AUTORIZADA: "Autorizada",
  AUTORIZADA_PENDIENTE_INGRESO: "Autorizada — pendiente de ingreso",
  NO_AUTORIZADA: "No autorizada",
};

export function formatQuoteType(type: string): string {
  return type.replace(/_/g, " ");
}

export function formatAssetSummary(params: {
  assetLabel: string | null;
  prelimEquipmentType: string | null;
  prelimBrand: string | null;
  prelimModel: string | null;
}): string {
  if (params.assetLabel) return params.assetLabel;
  const parts = [
    params.prelimEquipmentType,
    params.prelimBrand,
    params.prelimModel,
  ]
    .map((s) => s?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
