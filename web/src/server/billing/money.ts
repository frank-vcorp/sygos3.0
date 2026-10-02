const IVA_RATE = 0.16;

export function splitTotalsFromSubtotal(subtotalMxn: number, discountMxn = 0) {
  const subtotal = Math.max(0, subtotalMxn);
  const discount = Math.min(discountMxn, subtotal);
  const beforeIva = subtotal - discount;
  const ivaMxn = Math.round(beforeIva * IVA_RATE);
  const totalMxn = beforeIva + ivaMxn;
  return { subtotalMxn: subtotal, discountMxn: discount, ivaMxn, totalMxn };
}
