/*
 * EN: Right of Withdrawal (Widerrufsbelehrung) legal page. Full German text incl.
 *     the § 312g Abs. 2 Nr. 1 BGB exclusion and the model withdrawal form. Static
 *     (lang="de") for legal accuracy; the i18n title + breadcrumb stay bilingual.
 *     Outstanding client data is marked with <nm-todo-admin> badges.
 *     Breadcrumb: Home › Legal › Withdrawal.
 * RU: Юридическая страница «Право на отзыв (Widerruf)». Полный немецкий текст,
 *     включая исключение по § 312g Abs. 2 Nr. 1 BGB и образец формы. Статично
 *     (lang="de"); недостающие данные помечены <nm-todo-admin>.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TodoAdminComponent } from '@shared/components/todo-admin/todo-admin.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-withdrawal-page',
  imports: [BreadcrumbComponent, SkeletonComponent, TodoAdminComponent, TranslatePipe],
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
