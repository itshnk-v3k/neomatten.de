/*
 * EN: Home before/after section — wraps the shared nm-before-after slider with a
 *     section heading. Comparison images are admin-managed placeholders for now.
 * RU: Секция «до/после» главной — оборачивает общий слайдер nm-before-after с
 *     заголовком. Изображения сравнения — пока заглушки из админки.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MediaService } from '@core/services/media.service';
import { BeforeAfterComponent } from '@shared/components/before-after/before-after.component';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-home-before-after',
  imports: [TranslatePipe, RevealOnScrollDirective, BeforeAfterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './before-after-section.component.html',
  styleUrl: './before-after-section.component.scss',
})
export class BeforeAfterSectionComponent {
  private readonly media = inject(MediaService);

  // TODO(admin): placeholders routed through MediaService until real photos land.
  /** Before/after comparison images. */
  protected readonly beforeImage = this.media.getPlaceholder(900, 506, 'neomatten-before');
  protected readonly afterImage = this.media.getPlaceholder(900, 506, 'neomatten-after');
}
