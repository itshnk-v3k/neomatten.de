/*
 * EN: Imprint (Impressum) legal page. Full German legal text per § 5 DDG, static
 *     (lang="de") for legal accuracy; the i18n title + breadcrumb stay bilingual.
 *     Outstanding client data is marked with <nm-todo-admin> badges.
 *     Breadcrumb: Home › Legal › Imprint.
 * RU: Юридическая страница «Impressum». Полный немецкий текст по § 5 DDG, статично
 *     (lang="de"); заголовок и крошки остаются двуязычными. Недостающие данные
 *     клиента помечены <nm-todo-admin>. Крошки: Главная › Юридическое › Impressum.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TodoAdminComponent } from '@shared/components/todo-admin/todo-admin.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-imprint-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TodoAdminComponent, TranslatePipe],
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
