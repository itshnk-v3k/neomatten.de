/*
 * EN: Media service — the single seam for every admin-managed image. Today it
 *     returns placeholder URLs (picsum) and null for not-yet-uploaded assets so
 *     components fall back to their built-in placeholders (BrandLogoComponent
 *     initials, the CSS mat preview). When the backend lands, each method body
 *     swaps to a real `GET /api/media` lookup / CDN URL — a one-line change per
 *     method, with no call-site changes.
 * RU: Медиа-сервис — единая точка для всех управляемых из админки изображений.
 *     Сейчас отдаёт URL-заглушки (picsum) и null для ещё не загруженных ресурсов,
 *     чтобы компоненты использовали свои фолбэки (инициалы BrandLogoComponent,
 *     CSS-превью коврика). С появлением бэкенда тело каждого метода меняется на
 *     реальный запрос `GET /api/media` / URL CDN — по одной строке на метод, без
 *     изменения мест вызова.
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
   * Stable placeholder image URL. `seed` keeps the same random image across
   * reloads (per content slot). TODO(admin): every caller of this is a slot the
   * admin will fill with a real uploaded image; remove the placeholder then.
   */
  getPlaceholder(width: number, height: number, seed?: string): string {
    return seed
      ? `https://picsum.photos/seed/${seed}/${width}/${height}`
      : `https://picsum.photos/${width}/${height}`;
  }

  /**
   * Real brand logo URL, or null to fall back to the BrandLogoComponent initials.
   * Brands with a bundled vector mark (simple-icons) are handled inline by
   * BrandLogoComponent and never reach this method. The set below is every brand
   * that ships a bitmap logo under `src/assets/brands/`.
   * TODO(admin)/TODO(backend): once brand logos are managed in the admin panel,
   * return the uploaded logo URL from the media API instead of the bundled asset.
   */
  getBrandLogoUrl(brandSlug: string): string | null {
    return MediaService.BRAND_LOGO_FILES.has(brandSlug) ? `assets/brands/${brandSlug}.png` : null;
  }

  /** Brand ids (brands.json) with a bitmap logo file in `src/assets/brands/`. */
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
