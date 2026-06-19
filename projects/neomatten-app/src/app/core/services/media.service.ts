/*
 * EN: Media service — the single seam for every admin-managed image. Today it
 *     returns null for not-yet-uploaded assets so components fall back to their
 *     built-in placeholders (the nm-image-placeholder component, BrandLogoComponent
 *     initials, the CSS mat preview). When the backend lands, each method body
 *     swaps to a real `GET /api/media` lookup / CDN URL — a one-line change per
 *     method, with no call-site changes.
 * RU: Медиа-сервис — единая точка для всех управляемых из админки изображений.
 *     Сейчас отдаёт null для ещё не загруженных ресурсов, чтобы компоненты
 *     использовали свои фолбэки (компонент nm-image-placeholder, инициалы
 *     BrandLogoComponent, CSS-превью коврика). С появлением бэкенда тело каждого
 *     метода меняется на реальный запрос `GET /api/media` / URL CDN — по одной
 *     строке на метод, без изменения мест вызова.
 */
import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '@core/http/api.service';

@Injectable({ providedIn: 'root' })
export class MediaService {
  // Reserved for the real backend; unused by the mock but kept so the swap is local.
  // TODO(backend): GET /api/media/:id
  // TODO(backend): GET /api/media?category=hero|gallery|product|brand-logo
  // TODO(backend): POST /api/media (upload, admin only)
  // TODO(backend): DELETE /api/media/:id (admin only)
  private readonly api = inject(ApiService);

  private readonly loadingSignal = signal(true);
  /** True while media resolves; flips false after a short delay (mock). */
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    // Mock loading delay so skeleton states are visible during development.
    // TODO(backend): drive `loading` from the media API request lifecycle.
    setTimeout(() => this.loadingSignal.set(false), 600);
  }

  /**
   * Returns null for an as-yet-unfilled image slot so callers render the local
   * nm-image-placeholder. The width/height/seed params are kept for the call
   * sites (a future media API will use them to resolve a real CDN URL).
   * TODO(admin): every caller of this is a slot the admin will fill with a real
   * uploaded image; return the uploaded URL from the media API then.
   */
  getPlaceholder(width: number, height: number, seed?: string): null {
    void width;
    void height;
    void seed;
    return null;
  }

  /**
   * Real brand logo URL, or null to fall back to the BrandLogoComponent initials.
   * Brands with a bundled vector mark (simple-icons) are handled inline by
   * BrandLogoComponent and never reach this method. The set below is every brand
   * that ships a bitmap logo under `src/assets/images/brands/`.
   * TODO(admin)/TODO(backend): once brand logos are managed in the admin panel,
   * return the uploaded logo URL from the media API instead of the bundled asset.
   */
  getBrandLogoUrl(brandSlug: string): string | null {
    if (!brandSlug || brandSlug.trim() === '') return null;
    // Normalize a display name or loose id to the asset filename slug
    // (e.g. "Alfa Romeo" → "alfa-romeo").
    const slug = brandSlug
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // spaces → hyphens
      .replace(/[^a-z0-9-]/g, ''); // drop special chars
    return MediaService.BRAND_LOGO_FILES.has(slug) ? `assets/images/brands/${slug}.webp` : null;
  }

  /** Brand ids (brands.json) with a bitmap logo file in `src/assets/images/brands/`. */
  private static readonly BRAND_LOGO_FILES = new Set<string>([
    'alfa-romeo',
    'buick',
    'byd',
    'chery',
    'daewoo',
    'daihatsu',
    'dodge',
    'faw',
    'gaz',
    'geely',
    'gmc',
    'great-wall',
    'hummer',
    'ikco',
    'isuzu',
    'jac',
    'jaguar',
    'lancia',
    'land-rover',
    'lexus',
    'lifan',
    'lincoln',
    'mercedes-benz',
    'saab',
    'scion',
    'ssangyong',
    'uaz',
    'zaz',
  ]);

  /**
   * Real mat-preview photo URL for a configured mat, or null to fall back to the
   * CSS-rendered preview. TODO(admin)/TODO(backend): return the admin-uploaded
   * render for this sku + texture + colour from the media API.
   */
  getMatPreviewUrl(sku: string, texture: string, color: string): string | null {
    void sku;
    void texture;
    void color;
    return null;
  }
}
