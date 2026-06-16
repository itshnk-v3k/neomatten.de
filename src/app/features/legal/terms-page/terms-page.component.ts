/*
 * EN: Terms & Conditions (AGB) legal page. Static structured sections, all text
 *     via translate keys. Breadcrumb: Home › Legal › Terms.
 * RU: Юридическая страница «Условия (AGB)». Статичные секции, весь текст через
 *     ключи перевода. Крошки: Главная › Юридическое › Условия.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-terms-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terms-page.component.html',
  styleUrl: './terms-page.component.scss',
})
export class TermsPageComponent {
  /** Local loading flag (no backing service): briefly shows skeletons on render. */
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => setTimeout(() => this.loading.set(false), 600));
  }
}
