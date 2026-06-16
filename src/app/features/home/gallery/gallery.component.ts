/*
 * EN: "Our Works" gallery carousel. Ports the legacy slider.js to embla-carousel
 *     (loop + 6s autoplay) with prev/next controls and clickable dots whose active
 *     state tracks the selected snap. Captions are brand/model strings (not i18n).
 * RU: Карусель-галерея «Unsere Arbeiten». Портирует устаревший slider.js на
 *     embla-carousel (зацикливание + автопрокрутка 6с) с кнопками назад/вперёд и
 *     кликабельными точками, чьё активное состояние следует за выбранным слайдом.
 *     Подписи — строки марки/модели (не переводятся).
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideExpand } from '@lucide/angular';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import type { EmblaOptionsType } from 'embla-carousel';
import { EmblaCarouselDirective } from 'embla-carousel-angular';
import AutoplayPlugin from 'embla-carousel-autoplay';

import { GalleryAlbumDialogComponent } from '../gallery-album-dialog/gallery-album-dialog.component';

/**
 * A single photo inside a gallery album. `src` null → the local
 * nm-image-placeholder is rendered. `caption` is an admin label (not translated).
 */
export interface GalleryImage {
  readonly src: string | null;
  readonly alt: string;
  readonly caption?: string;
}

/**
 * A gallery album shown as one carousel slide. `title`/`coverImage` drive the
 * slide; clicking it opens the album dialog with all `images`. Strings are
 * admin-managed labels (kept as-is, not translated).
 */
export interface GalleryAlbum {
  readonly id: string;
  readonly title: string;
  readonly coverImage: string | null;
  readonly images: readonly GalleryImage[];
}

@Component({
  selector: 'nm-gallery',
  imports: [
    NgOptimizedImage,
    EmblaCarouselDirective,
    LucideChevronLeft,
    LucideChevronRight,
    LucideExpand,
    ImagePlaceholderComponent,
    GalleryAlbumDialogComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent {
  readonly albums = input.required<readonly GalleryAlbum[]>();

  /** Album dialog state: the opened album + its open flag. */
  protected readonly activeAlbum = signal<GalleryAlbum | null>(null);
  protected readonly albumOpen = signal(false);

  protected openAlbum(album: GalleryAlbum): void {
    this.activeAlbum.set(album);
    this.albumOpen.set(true);
  }

  protected readonly options: EmblaOptionsType = { loop: true, align: 'center' };
  protected readonly plugins = [
    AutoplayPlugin({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ];

  /** Index of the currently selected slide (drives the active dot). */
  protected readonly selected = signal(0);

  /**
   * EN: Indices of slide images that failed to load → render the placeholder.
   * RU: Индексы изображений слайдов, которые не загрузились → заглушка.
   */
  private readonly failed = signal<ReadonlySet<number>>(new Set());

  protected hasFailed(i: number): boolean {
    return this.failed().has(i);
  }

  protected onImageError(i: number): void {
    this.failed.update(s => new Set(s).add(i));
  }

  private readonly embla = viewChild.required(EmblaCarouselDirective);

  protected prev(): void {
    this.embla().goToPrev();
  }

  protected next(): void {
    this.embla().goToNext();
  }

  protected goTo(index: number): void {
    this.embla().goTo(index);
  }

  /** Keeps the active dot in sync with embla's selected snap on select/reInit. */
  protected onEmblaChange(): void {
    const api = this.embla().emblaApi;
    if (api) {
      this.selected.set(api.selectedScrollSnap());
    }
  }
}
