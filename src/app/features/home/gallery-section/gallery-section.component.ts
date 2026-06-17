/*
 * EN: Home work-gallery section. The embla carousel (nm-gallery) is heavy, so it
 *     only mounts once the section is scrolled near (nmLazySection); a skeleton
 *     grid stands in until then. Slides show real customer-mat photos served from
 *     src/assets/images/gallery.
 * RU: Секция галереи работ главной. Карусель embla (nm-gallery) тяжёлая, поэтому
 *     монтируется только при приближении прокрутки (nmLazySection); до этого —
 *     скелетон-сетка. На слайдах — реальные фото ковриков из src/assets/images/gallery.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { LazySectionDirective } from '@shared/directives/lazy-section.directive';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

import { type GalleryAlbum, GalleryComponent } from '../gallery/gallery.component';

/** Public base path (under angular.json's src/assets glob) for the work photos. */
const WORKS_BASE = 'assets/images/gallery';

/**
 * EN: Source folders → albums. `files` are the photo filenames in each folder;
 *     positions encode the mat location (front-left is the driver side on LHD).
 * RU: Папки-источники → альбомы. `files` — имена файлов фото в каждой папке;
 *     позиция кодирует место коврика (front-left — водительская сторона на ЛР).
 */
const ALBUM_SOURCES: readonly {
  readonly id: string;
  readonly title: string;
  readonly files: readonly string[];
}[] = [
  {
    id: 'audi-a6-c7-2017',
    title: 'Audi A6 C7 2017',
    files: [
      'audi-a6-c7-2017-back-left.webp',
      'audi-a6-c7-2017-back-right.webp',
      'audi-a6-c7-2017-front-left.webp',
      'audi-a6-c7-2017-front-right.webp',
    ],
  },
  {
    id: 'bmw-e46-cabrio',
    title: 'BMW E46 Cabrio',
    files: [
      'bmw-e46-cabrio-back-left.webp',
      'bmw-e46-cabrio-back-right.webp',
      'bmw-e46-cabrio-front-left.webp',
      'bmw-e46-cabrio-front-right.webp',
    ],
  },
  {
    id: 'hyundai-i20-2020',
    title: 'Hyundai i20 2020',
    files: [
      'hyundai-i20-2020-back-left.webp',
      'hyundai-i20-2020-back-right.webp',
      'hyundai-i20-2020-front-left.webp',
      'hyundai-i20-2020-front-right.webp',
    ],
  },
  {
    id: 'mercedes-benz-b-class-2018',
    title: 'Mercedes-Benz B-Class 2018',
    files: [
      'mercedes-benz-b-class-2018-back-right.webp',
      'mercedes-benz-b-class-2018-front-left.webp',
      'mercedes-benz-b-class-2018-front-right.webp',
    ],
  },
  {
    id: 'mercedes-benz-ml-2012',
    title: 'Mercedes-Benz ML 2012',
    files: [
      'mercedes-benz-ml-2012-back-left.webp',
      'mercedes-benz-ml-2012-back-right.webp',
      'mercedes-benz-ml-2012-front-left.webp',
      'mercedes-benz-ml-2012-front-right.webp',
      'mercedes-benz-ml-2012-trunk.webp',
    ],
  },
  {
    id: 'mercedes-benz-ml-350-2015',
    title: 'Mercedes-Benz ML 350 2015',
    files: [
      'mercedes-benz-ml-350-2015-back-right.webp',
      'mercedes-benz-ml-350-2015-front-left.webp',
      'mercedes-benz-ml-350-2015-front-right.webp',
      'mercedes-benz-ml-350-2015-trunk.webp',
    ],
  },
  {
    id: 'renault-talisman-2017',
    title: 'Renault Talisman 2017',
    files: [
      'renault-talisman-2017-back-left.webp',
      'renault-talisman-2017-back-right.webp',
      'renault-talisman-2017-front-left.webp',
      'renault-talisman-2017-front-right.webp',
      'renault-talisman-2017-trunk.webp',
    ],
  },
];

/** Display order within an album: front mats first, then rear, then trunk. */
const POSITION_ORDER = ['front-left', 'front-right', 'back-left', 'back-right', 'trunk'] as const;

/** Position slug from a filename ('…-front-left.webp' → 'front-left'). */
function positionSlug(id: string, file: string): string {
  return file.slice(id.length + 1).replace(/\.[^.]+$/, ''); // drop album-id prefix + extension
}

/** Human-readable position from a filename ('…-front-left.webp' → 'Front left'). */
function positionLabel(id: string, file: string): string {
  const position = positionSlug(id, file).replace(/-/g, ' '); // hyphens → spaces
  return position.charAt(0).toUpperCase() + position.slice(1);
}

/** Builds a gallery album from a source folder; cover = driver-side front mat. */
function buildAlbum(source: (typeof ALBUM_SOURCES)[number]): GalleryAlbum {
  const { id, title } = source;
  // Order photos front → rear → trunk; unknown positions sort to the end.
  const rank = (file: string): number => {
    const i = POSITION_ORDER.indexOf(positionSlug(id, file) as (typeof POSITION_ORDER)[number]);
    return i === -1 ? POSITION_ORDER.length : i;
  };
  const files = [...source.files].sort((a, b) => rank(a) - rank(b));
  const images = files.map(file => {
    const caption = positionLabel(id, file);
    return {
      src: `${WORKS_BASE}/${id}/${file}`,
      alt: `${title} — ${caption}`,
      caption,
    };
  });
  // Cover = driver-side front mat (front-left on LHD), else first file alphabetically.
  const cover = files.find(f => f.includes('front-left')) ?? files[0];
  return { id, title, coverImage: `${WORKS_BASE}/${id}/${cover}`, images };
}

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
  /** Heavy carousel defers instantiation until scrolled near (nmLazySection). */
  protected readonly galleryVisible = signal(false);

  /**
   * Work gallery albums built from src/assets/images/gallery. Each carousel slide shows
   * an album cover; clicking it opens a dialog with all of the album's photos.
   * Titles are brand/model labels and captions are mat positions (not translated).
   */
  protected readonly galleryAlbums: readonly GalleryAlbum[] = ALBUM_SOURCES.map(buildAlbum);
}
