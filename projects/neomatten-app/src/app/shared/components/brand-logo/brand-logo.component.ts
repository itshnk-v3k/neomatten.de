/*
 * EN: Brand logo. Resolves the best available mark for a brand and renders one of
 *     three ways, in priority order:
 *       1. a bundled simple-icons vector mark → inline scalable SVG (nm-brand-icon);
 *       2. an uploaded/bundled bitmap (MediaService.getBrandLogoUrl) → NgOptimizedImage;
 *       3. neither → a chrome tile with 1–2 brand initials (decorative fallback).
 *     `slug` (the brands.json id) drives resolution; `name` derives the initials/alt.
 * RU: Логотип марки. Подбирает лучший доступный знак и рисует одним из трёх способов
 *     в порядке приоритета:
 *       1. векторный знак simple-icons → встроенный масштабируемый SVG (nm-brand-icon);
 *       2. загруженный/встроенный растр (MediaService.getBrandLogoUrl) → NgOptimizedImage;
 *       3. ничего из этого → хром-плитка с 1–2 инициалами марки (декоративный фолбэк).
 *     `slug` (id из brands.json) определяет выбор; `name` даёт инициалы/alt.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MediaService } from '@core/services/media.service';
import { BrandIconComponent } from '@shared/components/brand-icon/brand-icon.component';

import { BRAND_SIMPLE_ICONS } from './brand-simple-icons';

export type BrandLogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'nm-brand-logo',
  imports: [BrandIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-logo.component.html',
  styleUrl: './brand-logo.component.scss',
})
export class BrandLogoComponent {
  private readonly media = inject(MediaService);

  /** Brand display name (alt text + initials fallback). */
  readonly name = input.required<string>();
  /** Brand id/slug (brands.json) used to resolve a real logo; defaults to the name. */
  readonly slug = input<string>('');
  readonly size = input<BrandLogoSize>('md');

  /** simple-icons vector mark for this brand, or undefined. */
  protected readonly icon = computed(() => BRAND_SIMPLE_ICONS[this.slug()]);

  /** Bitmap logo URL when there is no vector mark, else null (→ initials). */
  protected readonly logoUrl = computed(() =>
    this.icon() ? null : this.media.getBrandLogoUrl(this.slug())
  );

  /** Flips true if the bitmap logo fails to load → render the initials tile. */
  protected readonly logoFailed = signal(false);

  constructor() {
    // Reset the failure flag whenever the resolved logo changes (e.g. a reused
    // instance switches brand) so the new logo gets a fresh attempt.
    effect(() => {
      this.logoUrl(); // track
      this.logoFailed.set(false);
    });
  }

  protected readonly initials = computed(() => {
    const letters = this.name().replace(/[^a-zA-Z]/g, '');
    return (letters.slice(0, 2) || this.name().slice(0, 2)).toUpperCase();
  });

  /** Square box size shared by the SVG mark, the image frame and the initials tile. */
  protected readonly sizeClass = computed(() => {
    const sizes: Record<BrandLogoSize, string> = {
      sm: 'size-9',
      md: 'size-11',
      lg: 'size-14',
    };
    return sizes[this.size()];
  });

  /** Initials-tile classes (box size + matching text size). */
  protected readonly boxClass = computed(() => {
    const text: Record<BrandLogoSize, string> = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };
    return `${this.sizeClass()} ${text[this.size()]}`;
  });
}
