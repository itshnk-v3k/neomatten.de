/*
 * Admin products data service. Wraps the NestJS admin endpoints under
 * /api/admin/products (auth + admin token attached by the interceptors).
 * V1: flat Product model only — no images/description/specs/stock (see the
 * planning notes and ADMIN.md; media is a separate future task).
 */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Product families the admin may assign (mirrors the backend DTO's PRODUCT_TYPES). */
export const PRODUCT_TYPES = ['mats', 'cushion', 'eva_bag', 'leather_bag'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** A product row as returned by the admin API (mirrors the Prisma Product model). */
export interface AdminProduct {
  readonly id: string;
  readonly slug: string;
  readonly type: string;
  readonly nameDE: string;
  readonly nameEN: string;
  /** Prisma Decimal serializes to a string over the wire; coerce with Number() to display. */
  readonly basePrice: string | number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Writable fields for create/update (flat model only). */
export interface ProductInput {
  readonly nameDE: string;
  readonly nameEN: string;
  readonly slug: string;
  readonly type: string;
  readonly basePrice: number;
  readonly isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductsAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin/products`;

  /** Full list (active + inactive), newest first. */
  list(): Promise<AdminProduct[]> {
    return firstValueFrom(this.http.get<AdminProduct[]>(this.base));
  }

  /** Create a product. Rejects with HTTP 409 if the slug collides. */
  create(input: ProductInput): Promise<AdminProduct> {
    return firstValueFrom(this.http.post<AdminProduct>(this.base, input));
  }

  /** Update fields on a product. Rejects with HTTP 409 if the slug collides. */
  update(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
    return firstValueFrom(this.http.patch<AdminProduct>(`${this.base}/${id}`, input));
  }

  /** Hard-delete a product (no OrderItem FK — safe). */
  remove(id: string): Promise<{ id: string }> {
    return firstValueFrom(this.http.delete<{ id: string }>(`${this.base}/${id}`));
  }
}
