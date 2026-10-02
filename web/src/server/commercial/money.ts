const IVA_RATE = 0.16;

export function computeQuoteTotals(params: {
  subtotalMxn: number;
  discountPct?: number | null;
  discountMxn?: number | null;
}) {
  let subtotal = Math.max(0, params.subtotalMxn);
  let discount = params.discountMxn ?? 0;
  if (params.discountPct != null && params.discountPct > 0) {
    discount = Math.round((subtotal * params.discountPct) / 100);
  }
  discount = Math.min(discount, subtotal);
  const priceBeforeIva = subtotal - discount;
  const ivaMxn = Math.round(priceBeforeIva * IVA_RATE);
  const totalMxn = priceBeforeIva + ivaMxn;
  return {
    subtotalMxn: subtotal,
    discountMxn: discount,
    priceBeforeIvaMxn: priceBeforeIva,
    ivaMxn,
    totalMxn,
  };
}

export function formatMxn(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}
