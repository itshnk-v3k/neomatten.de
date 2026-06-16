/*
 * EN: Catalogue product service for the simple (non-configured) products —
 *     headrest cushions, EVA-material bags and EVA-leather bags. Loads the mock
 *     products.json once and exposes signals + category / subcategory / id
 *     lookups. The mock-vs-API URL is the only thing that changes when the real
 *     .NET/PostgreSQL backend lands.
 * RU: Сервис товаров каталога для простых (неконфигурируемых) товаров — кисени
 *     на подголовник, сумки из EVA-материала и EVA-кожи. Один раз грузит
 *     mock products.json и отдаёт сигналы + выборки по категории / подкатегории /
 *     id. При появлении бэкенда меняется только URL.
 */
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { ProductCategory } from '@core/models/order.model';
import type { ProductDTO } from '@core/models/product.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  /**
   * All products (empty until the mock JSON resolves).
   * TODO(backend): replace the URL with `GET /api/products` (drop the mock flag).
   */
  readonly products = toSignal(this.http.get<ProductDTO[]>(this.url()), {
    initialValue: [] as ProductDTO[],
  });

  readonly loaded = computed(() => this.products().length > 0);

  private readonly loadingSignal = signal(true);
  /** True while the initial (mock) data loads; flips false after a short delay. */
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    // Mock loading delay so skeleton states are visible during development.
    // TODO(backend): drive `loading` from the real request lifecycle instead.
    setTimeout(() => this.loadingSignal.set(false), 600);
  }

  private url(): string {
    return environment.features.useMockData ? '/assets/mock-data/products.json' : '/api/products';
  }

  /** Products in a category (optionally narrowed to a subcategory). */
  byCategory(category: ProductCategory, subcategory?: string): ProductDTO[] {
    return this.products().filter(
      p => p.category === category && (!subcategory || p.subcategory === subcategory)
    );
  }

  /** A single product by id. TODO(backend): `GET /api/products/:id`. */
  byId(id: string): ProductDTO | undefined {
    return this.products().find(p => p.id === id);
  }
}
