/*
 * EN: Skeleton placeholder for the shared UI kit. A pulsing block whose shape is
 *     chosen via `variant` (text/title/circle/card/image/button/badge), with
 *     optional `width`/`height` overrides and, for the text variant, a `lines`
 *     count (stacked with gap-2, last line shortened for realism). The merged
 *     `class` input still overrides everything for one-off cases.
 * RU: Скелетон-заглушка общего UI-кита. Пульсирующий блок, форма задаётся через
 *     `variant` (text/title/circle/card/image/button/badge), с необязательными
 *     `width`/`height` и (для text) количеством строк `lines` (стек с gap-2,
 *     последняя строка короче). Вход `class` по-прежнему переопределяет всё.
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn } from '@shared/utils/cn';

export type SkeletonVariant = 'text' | 'title' | 'circle' | 'card' | 'image' | 'button' | 'badge';

/** Base Tailwind classes per shape variant (width/height can be overridden). */
const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-md',
  title: 'h-7 w-2/3 rounded-md',
  circle: 'rounded-full',
  card: 'h-48 w-full rounded-lg',
  image: 'h-full w-full rounded-lg',
  button: 'h-10 w-32 rounded-full',
  badge: 'h-6 w-16 rounded-full',
};

@Component({
  selector: 'nm-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  /** Shape preset. */
  readonly variant = input<SkeletonVariant>('text');
  /** Optional explicit width (e.g. '12rem', '60%'); overrides the variant width. */
  readonly width = input<string>('');
  /** Optional explicit height; overrides the variant height. */
  readonly height = input<string>('');
  /** Number of stacked lines for the `text` variant. */
  readonly lines = input<number>(1);

  /** Consumer-provided classes (w/h/rounded) merged over the defaults. */
  // Aliasing to `class` is the intended UI-kit API (consumers pass `class="…"`).
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly classNames = input<string>('', { alias: 'class' });

  /** Base block classes for the chosen variant. */
  protected readonly blockClass = computed(() =>
    cn('animate-pulse bg-surface-muted', VARIANT_CLASSES[this.variant()], this.classNames())
  );

  /** True when rendering a multi-line text skeleton. */
  protected readonly isMultiLine = computed(() => this.variant() === 'text' && this.lines() > 1);

  /** Index list for the line loop. */
  protected readonly lineIndices = computed(() =>
    Array.from({ length: Math.max(1, this.lines()) }, (_, i) => i)
  );

  /** Last line is shortened for realism (unless an explicit width is set). */
  protected readonly lastLineClass = computed(() =>
    this.width() ? this.blockClass() : cn(this.blockClass(), 'w-4/5')
  );

  /** Inline width/height overrides (null = let the variant classes decide). */
  protected readonly styleWidth = computed(() => this.width() || null);
  protected readonly styleHeight = computed(() => this.height() || null);
}
