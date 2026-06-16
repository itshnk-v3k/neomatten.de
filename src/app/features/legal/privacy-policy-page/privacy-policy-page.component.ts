/*
 * EN: Privacy Policy (Datenschutzerklärung) legal page. Static structured
 *     sections, all text via translate keys. Breadcrumb: Home › Legal › Privacy.
 * RU: Юридическая страница «Политика конфиденциальности». Статичные секции,
 *     весь текст через ключи перевода. Крошки: Главная › Юридическое › Политика.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-privacy-policy-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-policy-page.component.html',
  styleUrl: './privacy-policy-page.component.scss',
})
export class PrivacyPolicyPageComponent {
  /** Local loading flag (no backing service): briefly shows skeletons on render. */
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => setTimeout(() => this.loading.set(false), 600));
  }
}
