/*
 * EN: "Our Work" gallery carousel. Ports the legacy slider.js to embla-carousel
 *     (loop + 6s autoplay) with prev/next controls and clickable dots whose active
 *     state tracks the selected snap. Captions are brand/model strings (not i18n).
 * RU: Карусель-галерея «Unsere Arbeiten». Портирует устаревший slider.js на
 *     embla-carousel (зацикливание + автопрокрутка 6с) с кнопками назад/вперёд и
 *     кликабельными точками, чьё активное состояние следует за выбранным слайдом.
 *     Подписи — строки марки/модели (не переводятся).
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal, viewChild } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import type { EmblaOptionsType } from 'embla-carousel';
import { EmblaCarouselDirective } from 'embla-carousel-angular';
import AutoplayPlugin from 'embla-carousel-autoplay';

/** A single gallery slide. `caption` is a brand/model label (kept as-is, not translated). */
export interface GallerySlide {
  readonly src: string;
  readonly caption: string;
}

@Component({
  selector: 'nm-gallery',
  imports: [
    NgOptimizedImage,
    EmblaCarouselDirective,
    LucideChevronLeft,
    LucideChevronRight,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent {
  readonly slides = input.required<readonly GallerySlide[]>();

  protected readonly options: EmblaOptionsType = { loop: true, align: 'center' };
  protected readonly plugins = [
    AutoplayPlugin({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ];

  /** Index of the currently selected slide (drives the active dot). */
  protected readonly selected = signal(0);

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
