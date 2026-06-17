/*
 * EN: Money math helpers, shared so cart, checkout and configurator never drift.
 *     `round2` avoids float artefacts; `computeTotals` is the single definition of
 *     the discount + grand-total formula (was previously copy-pasted in 3 places).
 * RU: Помощники для денежной арифметики — общие, чтобы корзина, оформление и
 *     конфигуратор не расходились. `round2` устраняет погрешности float;
 *     `computeTotals` — единственное определение формулы скидки и итоговой суммы.
 */

/** Rounds to 2 decimal places (avoids float drift in money math). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Discount + grand total derived from a subtotal/shipping pair. */
export interface OrderTotals {
  readonly discount: number;
  readonly total: number;
}

/**
 * The single source of truth for the order totals formula: a first-order discount
 * (when it applies) off the subtotal, then `subtotal − discount + shipping`,
 * clamped at zero. Used by the cart, checkout and configurator alike so a pricing
 * change can never drift between them.
 */
export function computeTotals(args: {
  readonly subtotal: number;
  readonly shipping: number;
  readonly discountApplies: boolean;
  readonly discountRate: number;
}): OrderTotals {
  const discount = args.discountApplies ? round2(args.subtotal * args.discountRate) : 0;
  const total = round2(Math.max(0, args.subtotal - discount) + args.shipping);
  return { discount, total };
}
