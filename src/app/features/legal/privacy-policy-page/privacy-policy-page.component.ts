/*
 * EN: Privacy Policy (Datenschutzerklärung) legal page. Full German GDPR text,
 *     static (lang="de") for legal accuracy; the i18n title + breadcrumb stay
 *     bilingual. Outstanding client data is marked with <nm-todo-admin> badges.
 *     Breadcrumb: Home › Legal › Privacy.
 * RU: Юридическая страница «Политика конфиденциальности». Полный немецкий текст
 *     по DSGVO, статично (lang="de"); заголовок и крошки двуязычные. Недостающие
 *     данные помечены <nm-todo-admin>. Крошки: Главная › Юридическое › Политика.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TodoAdminComponent } from '@shared/components/todo-admin/todo-admin.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-privacy-policy-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TodoAdminComponent, TranslatePipe],
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
