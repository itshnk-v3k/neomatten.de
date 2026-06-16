/*
 * EN: Catalogue product DTO for the simple (non-configured) products — headrest
 *     cushions, EVA-material bags and EVA-leather bags. Maps to a future
 *     `products` table; the mock data lives in assets/mock-data and is served by
 *     ProductService. `specs` is an ordered list of label/value pairs (label is
 *     a translate key) shown on the product detail page.
 * RU: DTO товара каталога для простых (неконфигурируемых) товаров — кисени на
 *     подголовник, сумки из EVA-материала и из EVA-кожи. Ложится в будущую
 *     таблицу `products`; mock-данные в assets/mock-data, отдаёт ProductService.
 *     `specs` — упорядоченный список пар метка/значение (метка — ключ перевода)
 *     для страницы товара.
 */
import type { CartItem } from './cart-item.model';
import type { ProductCategory } from './order.model';

/** A single spec row on the product detail page. `labelKey` is a translate key. */
export interface ProductSpec {
  readonly labelKey: string;
  readonly value: string;
}

/** A catalogue product. */
export interface ProductDTO {
  readonly id: string;
  readonly sku: string;
  readonly category: ProductCategory;
  /** Optional sub-group within a category (e.g. 'with-lid' / 'without-lid' for bags). */
  readonly subcategory?: string;
  /** Display name (kept verbatim, not translated — admin-managed copy). */
  readonly name: string;
  readonly description: string;
  readonly specs: readonly ProductSpec[];
  readonly price: number;
  /**
   * Units available to order. Mock values today; driven by the backend later
   * (`GET /api/products`). 0 = out of stock (add-to-cart disabled); ≤5 shows a
   * low-stock warning.
   */
  readonly stockQuantity: number;
  /**
   * Image URLs for the detail-page carousel (first is the listing thumbnail).
   * Empty in the mock JSON today, so call sites render the local
   * nm-image-placeholder.
   * TODO(admin)/TODO(backend): these become admin-managed CDN URLs (MediaAsset)
   * served by `GET /api/products`; no call-site changes needed (kept as URL strings).
   */
  readonly images: readonly string[];
}

/** Router base path for a product category (detail = `${path}/${id}`). */
export function productCategoryPath(category: ProductCategory): string {
  switch (category) {
    case 'cushion':
      return '/cushions';
    case 'eva_bag':
      return '/eva-bags';
    case 'leather_bag':
      return '/leather-bags';
    case 'mats':
      return '/configurator';
  }
}

/** Builds a cart line from a simple product (quantity 1). `id` must be unique. */
export function productToCartItem(product: ProductDTO, id: string): CartItem {
  return {
    id,
    sku: product.sku,
    category: product.category,
    name: product.name,
    quantity: 1,
    unitPrice: product.price,
    thumbnailUrl: product.images[0] ?? undefined,
  };
}
