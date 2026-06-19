/*
 * EN: Image placeholder for the shared UI kit. Stands in wherever an
 *     admin-managed image is not yet uploaded (MediaService returns null) or a
 *     product has no images. Fills its host box (size-full) with a dashed-border
 *     surface and a centred image glyph so the layout is preserved.
 * RU: Заглушка изображения для общего UI-кита. Подставляется там, где
 *     управляемое из админки изображение ещё не загружено (MediaService отдаёт
 *     null) или у товара нет изображений. Заполняет свой бокс (size-full)
 *     поверхностью с пунктирной рамкой и иконкой по центру, сохраняя вёрстку.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideImage } from '@lucide/angular';

@Component({
  selector: 'nm-image-placeholder',
  imports: [LucideImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex size-full items-center justify-center rounded-lg border border-dashed border-border bg-surface-subtle text-content-muted">
      <svg lucideImage class="size-8 opacity-30"></svg>
    </div>
  `,
})
export class ImagePlaceholderComponent {}
