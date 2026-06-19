/*
 * EN: Loader/spinner for the shared UI kit. Renders a spinning lucide icon in the
 *     brand primary color with a size mapping (sm/md/lg) and an optional label
 *     (translation key) beside it, centered horizontally.
 * RU: Лоадер/спиннер общего UI-кита. Отрисовывает вращающуюся иконку lucide в
 *     фирменном основном цвете с маппингом размеров (sm/md/lg) и необязательной
 *     подписью (ключ перевода) рядом, центрируется по горизонтали.
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideLoaderCircle } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

export type LoaderSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'nm-loader',
  imports: [LucideLoaderCircle, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  readonly size = input<LoaderSize>('md');
  /** Optional label shown beside the spinner (translation key). */
  readonly labelKey = input<string>('');

  protected readonly iconClasses = computed(() => {
    const sizes: Record<LoaderSize, string> = {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
    };
    return `${sizes[this.size()]} animate-spin text-primary`;
  });
}
