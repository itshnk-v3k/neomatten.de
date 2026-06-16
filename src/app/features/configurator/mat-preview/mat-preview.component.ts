/*
 * EN: Mat preview placeholder. A large CSS-rendered mat that reflects the current
 *     texture (pattern overlay), material colour (fill) and edge colour (border),
 *     with a caption showing the material · texture name. Shows a badge when a 3D
 *     mount or a heel pad (standard/3d) is selected. Purely visual feedback —
 *     admin supplies real preview renders later.
 * RU: Заглушка-превью коврика. Большой CSS-коврик, отражающий текущую фактуру
 *     (узор), цвет материала (заливка) и цвет канта (рамка), с подписью «материал ·
 *     фактура». Показывает бейдж при выборе 3D-крепления или подпятника
 *     (стандарт/3D). Чисто визуальная обратная связь — реальные рендеры добавит
 *     админ позже.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MediaService } from '@core/services/media.service';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

import {
  type HeelPadAccessory,
  type HeelRest,
  type Mounting,
  type Texture,
} from '../configurator.service';

@Component({
  selector: 'nm-mat-preview',
  imports: [NgOptimizedImage, ImagePlaceholderComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mat-preview.component.html',
})
export class MatPreviewComponent {
  private readonly media = inject(MediaService);

  /** True while the preview render is still resolving (→ image skeleton). */
  protected readonly loading = this.media.loading;

  readonly texture = input.required<Texture>();
  readonly materialHex = input.required<string>();
  readonly edgeHex = input.required<string>();
  readonly mounting = input.required<Mounting>();
  readonly heelPad = input.required<HeelPadAccessory>();
  readonly heelRest = input.required<HeelRest>();
  /** Already-translated caption, e.g. "EVA · Raute". */
  readonly caption = input.required<string>();
  /** Resolved vehicle SKU + colour id, for the admin-managed preview render. */
  readonly sku = input<string>('');
  readonly colorId = input<string>('');

  /**
   * Real admin-uploaded mat-preview photo URL, or null → CSS-rendered fallback.
   * TODO(admin): MediaService.getMatPreviewUrl returns the uploaded render for
   * this sku + texture + colour from the media API once previews are managed.
   */
  protected readonly previewUrl = computed(() =>
    this.media.getMatPreviewUrl(this.sku(), this.texture(), this.colorId())
  );

  /**
   * EN: Flips true if the preview render fails to load → fall back to the placeholder.
   * RU: Становится true, если рендер-превью не загрузился → показываем заглушку.
   */
  protected readonly imageFailed = signal(false);

  protected onImageError(): void {
    this.imageFailed.set(true);
  }

  /** CSS background pattern for the selected texture. */
  protected readonly patternImage = computed(() => {
    switch (this.texture()) {
      case 'raute':
        return 'repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.12) 0 6px, transparent 6px 12px)';
      case 'wabe':
        return 'radial-gradient(rgba(255,255,255,0.22) 2px, transparent 2.5px)';
      case 'tropfen':
        return 'radial-gradient(circle at 4px 4px, rgba(0,0,0,0.18) 2px, transparent 3px)';
    }
  });

  protected readonly patternSize = computed(() =>
    this.texture() === 'raute' ? '14px 14px' : '16px 16px'
  );

  protected readonly heelPadLabelKey = computed(() => `configurator_heel_${this.heelPad()}`);
  protected readonly heelRestLabelKey = computed(() => `heel_rest_${this.heelRest()}`);
}
