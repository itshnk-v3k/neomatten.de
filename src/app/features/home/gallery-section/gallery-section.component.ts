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

import { type GalleryAlbum,GalleryComponent } from '../gallery/gallery.component';

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
   * Work gallery albums — titles/captions are brand/model labels (not translated).
   * Each album opens a dialog with all its photos. `getPlaceholder` returns null
   * today, so covers and photos render the local nm-image-placeholder.
   * TODO(admin): real work photos come from the media API (gallery category);
   * titles/captions/alt become admin-managed labels.
   */
  protected readonly galleryAlbums: readonly GalleryAlbum[] = [
    {
      id: 'renault-talisman-2017',
      title: 'Renault Talisman 2017',
      coverImage: this.media.getPlaceholder(980, 480, 'neomatten-talisman-cover'),
      images: [
        {
          src: this.media.getPlaceholder(640, 480, 'talisman-1'),
          alt: 'Driver mat',
          caption: 'Driver side',
        },
        {
          src: this.media.getPlaceholder(640, 480, 'talisman-2'),
          alt: 'Passenger mat',
          caption: 'Passenger side',
        },
        {
          src: this.media.getPlaceholder(640, 480, 'talisman-3'),
          alt: 'Rear mats',
          caption: 'Rear row',
        },
        {
          src: this.media.getPlaceholder(640, 480, 'talisman-4'),
          alt: 'Full interior',
          caption: 'Full interior',
        },
      ],
    },
    {
      id: 'audi-a7-eva-set',
      title: 'Audi A7 · EVA Set',
      coverImage: this.media.getPlaceholder(980, 480, 'neomatten-a7-cover'),
      images: [
        {
          src: this.media.getPlaceholder(640, 480, 'a7-1'),
          alt: 'Front mats',
          caption: 'Front row',
        },
        { src: this.media.getPlaceholder(640, 480, 'a7-2'), alt: 'Rear mats', caption: 'Rear row' },
        {
          src: this.media.getPlaceholder(640, 480, 'a7-3'),
          alt: 'Boot liner',
          caption: 'Boot liner',
        },
      ],
    },
    {
      id: 'bmw-5er-premium',
      title: 'BMW 5er · Premium',
      coverImage: this.media.getPlaceholder(980, 480, 'neomatten-bmw5-cover'),
      images: [
        {
          src: this.media.getPlaceholder(640, 480, 'bmw5-1'),
          alt: 'Driver mat',
          caption: 'Driver side',
        },
        {
          src: this.media.getPlaceholder(640, 480, 'bmw5-2'),
          alt: 'Passenger mat',
          caption: 'Passenger side',
        },
        {
          src: this.media.getPlaceholder(640, 480, 'bmw5-3'),
          alt: 'Rear mats',
          caption: 'Rear row',
        },
        {
          src: this.media.getPlaceholder(640, 480, 'bmw5-4'),
          alt: 'Heel pad detail',
          caption: 'Heel pad detail',
        },
      ],
    },
    {
      id: 'vw-golf-raute',
      title: 'VW Golf · Raute',
      coverImage: this.media.getPlaceholder(980, 480, 'neomatten-golf-cover'),
      images: [
        {
          src: this.media.getPlaceholder(640, 480, 'golf-1'),
          alt: 'Front mats',
          caption: 'Front row',
        },
        {
          src: this.media.getPlaceholder(640, 480, 'golf-2'),
          alt: 'Rear mats',
          caption: 'Rear row',
        },
      ],
    },
  ];
}
