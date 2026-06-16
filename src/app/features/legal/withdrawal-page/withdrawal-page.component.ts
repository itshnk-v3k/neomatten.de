/*
 * EN: Right of Withdrawal (Widerrufsbelehrung) legal page. Static structured
 *     sections, all text via translate keys. Breadcrumb: Home › Legal › Withdrawal.
 * RU: Юридическая страница «Право на отзыв (Widerruf)». Статичные секции, весь
 *     текст через ключи перевода. Крошки: Главная › Юридическое › Отзыв.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-withdrawal-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './withdrawal-page.component.html',
  styleUrl: './withdrawal-page.component.scss',
})
export class WithdrawalPageComponent {
  /** Local loading flag (no backing service): briefly shows skeletons on render. */
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => setTimeout(() => this.loading.set(false), 600));
  }
}
