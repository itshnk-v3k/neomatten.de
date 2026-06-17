/*
 * EN: Product-category chip presets — maps an order/cart item's ProductCategory to
 *     its i18n label key and chip classes, so the cart and account-orders surfaces
 *     render an identical, on-brand category badge from one source of truth.
 * RU: Пресеты чипа категории товара — сопоставляет ProductCategory позиции заказа/
 *     корзины с ключом перевода и классами чипа, чтобы корзина и заказы в личном
 *     кабинете показывали одинаковый фирменный бейдж категории из одного места.
 */
import type { ProductCategory } from '@core/models/order.model';

/** Resolved chip for a product category: i18n label key + full Tailwind classes. */
export interface CategoryBadge {
  readonly labelKey: string;
  /** Complete chip class string (compact rounded badge, matching status badges). */
  readonly chipClass: string;
}

/** Shared base: compact rounded chip, same shape as the order status badges. */
const CHIP_BASE =
  'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[0.625rem] font-semibold';

const CATEGORY_BADGES: Record<ProductCategory, CategoryBadge> = {
  // Configurator car mats → primary red tint.
  mats: { labelKey: 'category_eva_mats', chipClass: `${CHIP_BASE} bg-primary/10 text-primary` },
  // EVA bags → neutral dark chip.
  eva_bag: { labelKey: 'category_eva_bags', chipClass: `${CHIP_BASE} bg-ink text-white` },
  // Headrest cushions → subtle neutral chip.
  cushion: {
    labelKey: 'category_cushions',
    chipClass: `${CHIP_BASE} bg-surface-subtle text-content-secondary`,
  },
  // Leather bags → warm brown chip.
  leather_bag: {
    labelKey: 'category_leather_bags',
    chipClass: `${CHIP_BASE} bg-[#6b4423]/10 text-[#6b4423]`,
  },
};

/** Chip preset (label key + classes) for a product category. */
export function categoryBadge(category: ProductCategory): CategoryBadge {
  return CATEGORY_BADGES[category];
}
