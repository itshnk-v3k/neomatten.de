/*
 * EN: Home work-gallery section. The embla carousel (nm-gallery) is heavy, so it
 *     only mounts once the section is scrolled near (nmLazySection); a skeleton
 *     grid stands in until then. Slide images are admin-managed placeholders.
 * RU: Секция галереи работ главной. Карусель embla (nm-gallery) тяжёлая, поэтому
 *     монтируется только при приближении прокрутки (nmLazySection); до этого —
 *     скелетон-сетка. Изображения слайдов — заглушки из админки.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MediaService } from '@core/services/media.service';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { LazySectionDirective } from '@shared/directives/lazy-section.directive';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

import { GalleryComponent, type GallerySlide } from '../gallery/gallery.component';

@Component({
  selector: 'nm-home-gallery',
  imports: [
    TranslatePipe,
    RevealOnScrollDirective,
    LazySectionDirective,
    SkeletonComponent,
    GalleryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery-section.component.html',
  styleUrl: './gallery-section.component.scss',
})
export class GallerySectionComponent {
  private readonly media = inject(MediaService);

  /** Heavy carousel defers instantiation until scrolled near (nmLazySection). */
  protected readonly galleryVisible = signal(false);

  /**
   * Work gallery slides — captions are brand/model labels (not translated).
   * TODO(admin): images are placeholders; real work photos come from the media
   * API (gallery category). Captions become admin-managed alt/labels.
   */
  protected readonly gallerySlides: readonly GallerySlide[] = [
    { src: this.media.getPlaceholder(980, 480, 'neomatten-work1'), caption: 'Audi A7 · EVA Set' },
    { src: this.media.getPlaceholder(980, 480, 'neomatten-work2'), caption: 'BMW 5er · Premium' },
    {
      src: this.media.getPlaceholder(980, 480, 'neomatten-work3'),
      caption: 'Mercedes C · Vollset',
    },
    { src: this.media.getPlaceholder(980, 480, 'neomatten-work4'), caption: 'VW Golf · Raute' },
    { src: this.media.getPlaceholder(980, 480, 'neomatten-work5'), caption: 'Toyota Camry · EVA' },
    {
      src: this.media.getPlaceholder(980, 480, 'neomatten-work6'),
      caption: 'Hyundai Tucson · Set',
    },
  ];
}
