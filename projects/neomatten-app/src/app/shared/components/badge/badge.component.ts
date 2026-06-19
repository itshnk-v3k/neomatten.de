/*
 * EN: Badge for the shared UI kit. A small label chip with brand-styled
 *     variants (variant/size) via class-variance-authority; content is projected
 *     so consumers pass already-translated text (or a piped translation key).
 * RU: Бейдж общего UI-кита. Маленький чип-метка с фирменными вариантами
 *     (variant/size) через class-variance-authority; контент проецируется, чтобы
 *     потребители передавали уже переведённый текст (или ключ через пайп).
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { cn } from '@shared/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        primary: 'bg-primary/10 text-primary',
        neutral: 'bg-surface-subtle text-content-secondary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        outline: 'border border-border text-content',
      },
      size: {
        sm: 'px-2 py-0.5 text-[0.625rem]',
        md: 'px-2.5 py-0.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>['size']>;

@Component({
  selector: 'nm-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  host: {
    '[class]': 'classes()',
  },
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('primary');
  readonly size = input<BadgeSize>('md');
  /** Extra classes merged after the variant classes (Tailwind conflicts resolved). */
  // Aliasing to `class` is the intended UI-kit API (consumers pass `class="…"`).
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly classNames = input<string>('', { alias: 'class' });

  protected readonly classes = computed(() =>
    cn(badgeVariants({ variant: this.variant(), size: this.size() }), this.classNames())
  );
}
