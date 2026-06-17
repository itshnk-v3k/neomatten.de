/*
 * EN: Mat preview. A real mat texture photo (per selected texture) tinted by the
 *     chosen material colour (multiply overlay) with the edge trim tinted via an
 *     edging-shaped CSS mask, plus a caption and badges for 3D mount / heel pad.
 *     Visual simulation — admin supplies real per-SKU preview renders later
 *     (previewUrl branch), which take over when available.
 * RU: Превью коврика. Реальное фото фактуры (по выбранной фактуре), тонированное
 *     цветом материала (overlay multiply), с кантом, тонированным через CSS-маску
 *     формы канта, плюс подпись и бейджи 3D-крепления / подпятника. Визуальная
 *     симуляция — реальные рендеры по SKU добавит админ позже (ветка previewUrl).
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
  styleUrl: './mat-preview.component.scss',
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

  /** Base mat texture photo (WebP) for the selected texture (rhombus / honeycomb / drop). */
  protected readonly textureImageSrc = computed(
    () => `assets/images/mats/${this.texture()}-mat.webp`
  );

  /**
   * EN: Clips the mat-colour overlay to the mat body shape — the texture WebP's
   *     own alpha is used as a CSS mask, so the colour only tints the opaque mat
   *     (not the transparent background). Mask URL must be dynamic (per texture),
   *     so it's an inline style; root-absolute so it resolves on any route.
   *     `contain` + `center` mirrors the images' object-contain so they align.
   * RU: Обрезает слой цвета по форме коврика — альфа фото-фактуры служит CSS-маской,
   *     поэтому цвет тонирует только непрозрачный коврик (не прозрачный фон). URL
   *     маски динамический (по фактуре) → инлайн-стиль; корневой-абсолютный, чтобы
   *     резолвился на любом маршруте. `contain` + `center` совпадает с object-contain.
   */
  protected readonly matMaskStyle = computed(() => {
    const mask = `url(/assets/images/mats/${this.texture()}-mat.webp)`;
    return {
      'mask-image': mask,
      '-webkit-mask-image': mask,
      'mask-size': 'contain',
      '-webkit-mask-size': 'contain',
      'mask-repeat': 'no-repeat',
      '-webkit-mask-repeat': 'no-repeat',
      'mask-position': 'center',
      '-webkit-mask-position': 'center',
      // plus-lighter additively lightens the dark mat photo toward the chosen
      // colour, so light colours read clearly (multiply kept everything dark).
      'mix-blend-mode': 'plus-lighter',
    };
  });

  protected readonly heelPadLabelKey = computed(() => `configurator_heel_${this.heelPad()}`);
  protected readonly heelRestLabelKey = computed(() => `heel_rest_${this.heelRest()}`);
}
