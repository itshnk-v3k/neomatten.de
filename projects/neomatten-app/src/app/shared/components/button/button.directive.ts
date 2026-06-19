/*
 * EN: Button directive for the shared UI kit. Applies brand-styled variants
 *     (variant/size) to native <button>/<a> elements via class-variance-
 *     authority, preserving native semantics (type=submit, routerLink, etc.).
 * RU: Директива кнопки общего UI-кита. Применяет фирменные варианты (variant/
 *     size) к нативным <button>/<a> через class-variance-authority, сохраняя
 *     нативную семантику (type=submit, routerLink и т.д.).
 */
import { booleanAttribute, computed, Directive, HostListener, input } from '@angular/core';
import { cn } from '@shared/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

// `--nm-spin` sets the busy-spinner colour the global styles.scss rule reads
// (the label is hidden so currentColor can't be used): white on filled
// variants, brand red on transparent ones.
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all duration-150 ease-out-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-content-inverse hover:bg-primary-600 hover:shadow-glow-red hover:scale-[1.02] [--nm-spin:theme(colors.content.inverse)]',
        secondary:
          'bg-ink text-content-inverse hover:bg-ink-soft [--nm-spin:theme(colors.content.inverse)]',
        outline:
          'border border-border bg-transparent hover:bg-primary/10 hover:border-primary hover:text-primary [--nm-spin:theme(colors.primary.DEFAULT)]',
        ghost:
          'bg-transparent hover:bg-surface-subtle hover:text-primary [--nm-spin:theme(colors.primary.DEFAULT)]',
        destructive:
          'bg-error text-white hover:bg-red-700 hover:shadow-md [--nm-spin:theme(colors.content.inverse)]',
        link: 'text-primary underline-offset-4 hover:underline [--nm-spin:theme(colors.primary.DEFAULT)]',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

@Directive({
  selector: 'button[nmButton], a[nmButton]',
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.disabled]': 'isDisabled() ? "" : null',
  },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  /** When true the button is disabled, marked aria-busy, shows a wait cursor and
   *  the global busy-spinner overlay (no layout shift). Bind it to a `pending`
   *  signal (see {@link createAsyncAction}) to guard async actions. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Explicitly disables the button. Combined with `loading` into one source of
   *  truth so `[disabled]` and `[loading]` never fight over the native attribute. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Extra classes merged after the variant classes (Tailwind conflicts resolved). */
  // Aliasing to `class` is the intended UI-kit API (consumers pass `class="…"`).
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly classNames = input<string>('', { alias: 'class' });

  /** Non-interactive when explicitly disabled or busy. */
  protected readonly isDisabled = computed(() => this.disabled() || this.loading());

  protected readonly classes = computed(() =>
    cn(
      buttonVariants({ variant: this.variant(), size: this.size() }),
      // `<a>` has no native `disabled`, so the `disabled:` variants never fire on
      // anchors — apply the not-allowed state explicitly there (and as a guard).
      this.isDisabled() && 'pointer-events-none opacity-50',
      this.loading() && 'cursor-wait',
      this.classNames()
    )
  );

  /**
   * Defense-in-depth click guard: stops the handler firing while disabled/busy.
   * Native `disabled` already blocks <button>; this also covers `<a nmButton>`
   * (no native disabled) and the brief window before change detection reflects a
   * freshly-set `pending` onto the attribute.
   */
  @HostListener('click', ['$event'])
  protected onClick(event: Event): void {
    if (this.isDisabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
