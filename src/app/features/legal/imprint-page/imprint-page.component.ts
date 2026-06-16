/*
 * EN: Imprint (Impressum) legal page. Static, structured sections (h2 + p), all
 *     text via translate keys; placeholder company data until the client's real
 *     details land. Breadcrumb: Home › Legal › Imprint.
 * RU: Юридическая страница «Impressum». Статичные структурированные секции
 *     (h2 + p), весь текст через ключи перевода; данные компании — заглушки до
 *     реальных. Крошки: Главная › Юридическое › Impressum.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-imprint-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './imprint-page.component.html',
  styleUrl: './imprint-page.component.scss',
})
export class ImprintPageComponent {
  /** Local loading flag (no backing service): briefly shows skeletons on render. */
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => setTimeout(() => this.loading.set(false), 600));
  }
}
