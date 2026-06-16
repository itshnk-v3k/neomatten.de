/*
 * EN: EVA-material bags landing. Two category cards — "With lid" and "Without
 *     lid" — linking to the respective product listings. No products here; the
 *     listing lives at /eva-bags/with-lid and /eva-bags/without-lid.
 * RU: Лендинг сумок из EVA-материала. Две карточки категорий — «С крышкой» и
 *     «Без крышки» — со ссылками на соответствующие списки товаров. Здесь нет
 *     товаров; списки находятся на /eva-bags/with-lid и /eva-bags/without-lid.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MediaService } from '@core/services/media.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-eva-bags-page',
  imports: [RouterLink, BreadcrumbComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eva-bags-page.component.html',
  styleUrl: './eva-bags-page.component.scss',
})
export class EvaBagsPageComponent {
  private readonly media = inject(MediaService);

  // TODO(admin): category card images are placeholders routed through MediaService;
  // real photos come from the media API once uploaded.
  protected readonly withLidImage = this.media.getPlaceholder(800, 450, 'nm-bags-lid');
  protected readonly withoutLidImage = this.media.getPlaceholder(800, 450, 'nm-bags-open');
}
