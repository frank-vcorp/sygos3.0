/**
 * Staging / UAT: cierra flujos fiscales y nómina en BD sin Facturapi.
 * Activar solo con SYGOS_INTERNAL_FISCAL=1 en el runtime (UAT pre-prod).
 * Nunca en producción real con timbrado SAT.
 */
export function isInternalFiscalMode(): boolean {
  const v = process.env.SYGOS_INTERNAL_FISCAL?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
