/*
 * EN: Terms & Conditions (AGB) legal page. Full German terms (§ 1–§ 10), static
 *     (lang="de") for legal accuracy; the i18n title + breadcrumb stay bilingual.
 *     Outstanding client data is marked with <nm-todo-admin> badges.
 *     Breadcrumb: Home › Legal › Terms.
 * RU: Юридическая страница «Условия (AGB)». Полный немецкий текст (§ 1–§ 10),
 *     статично (lang="de"); заголовок и крошки двуязычные. Недостающие данные
 *     помечены <nm-todo-admin>. Крошки: Главная › Юридическое › Условия.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TodoAdminComponent } from '@shared/components/todo-admin/todo-admin.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-terms-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TodoAdminComponent, TranslatePipe],
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
