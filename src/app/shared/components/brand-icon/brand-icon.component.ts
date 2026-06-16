/*
 * EN: Brand/social icon for the shared UI kit. Renders simple-icons raw SVG path
 *     data as an inline <svg> sized via the size-* Tailwind convention, filled with
 *     currentColor so it inherits the surrounding text color (and its hover state).
 * RU: Бренд/соц-иконка общего UI-кита. Отрисовывает сырые SVG-пути из simple-icons
 *     как встроенный <svg>, размер задаётся через size-* Tailwind, заливка currentColor,
 *     чтобы наследовать цвет текста окружения (и его состояние при наведении).
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn } from '@shared/utils/cn';

/**
 * Structural shape of a simple-icons icon (e.g. `siInstagram`). Declared locally so
 * consumers can pass any simple-icon object without coupling the kit to the package.
 */
export interface BrandIcon {
  readonly title: string;
  readonly path: string;
  readonly hex: string;
}

@Component({
  selector: 'nm-brand-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-icon.component.html',
  styleUrl: './brand-icon.component.scss',
})
export class BrandIconComponent {
  /** simple-icons icon object providing the raw SVG `path` data + brand `title`/`hex`. */
  readonly icon = input.required<BrandIcon>();

  /**
   * Square size + any extra classes, merged over the `size-5` default. Pass a single
   * `size-*` token for icons (square by convention); Tailwind conflicts are resolved.
   */
  // Aliasing to `class` is the intended UI-kit API (consumers pass `class="size-4"`).
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly classNames = input<string>('', { alias: 'class' });

  /**
   * When true the icon renders in its official brand colour (`icon.hex`) instead
   * of `currentColor`. Use for payment/brand marks that must keep brand colours
   * (e.g. Visa blue, PayPal); leave false for monochrome social icons that should
   * inherit the surrounding text colour.
   */
  readonly colored = input<boolean>(false);

  protected readonly classes = computed(() => cn('size-5', this.classNames()));

  /** SVG fill: the brand hex when `colored`, otherwise `currentColor`. */
  protected readonly fill = computed(() =>
    this.colored() ? `#${this.icon().hex}` : 'currentColor'
  );
}
