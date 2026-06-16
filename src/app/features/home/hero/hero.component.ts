/*
 * EN: Home hero section. Full-bleed background — autoplaying muted video on md+,
 *     a static poster image on mobile to save bandwidth. The video/poster switch
 *     is kept in sync with viewport width across resize + orientation change.
 * RU: Геро-секция главной. Фон во всю ширину — автоплей-видео без звука на md+,
 *     статичный постер на мобильных ради трафика. Переключение видео/постер
 *     синхронизируется с шириной вьюпорта при ресайзе и смене ориентации.
 */
import { NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ScrollService } from '@core/services/scroll.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { debounceTime, fromEvent } from 'rxjs';

@Component({
  selector: 'nm-home-hero',
  imports: [NgOptimizedImage, RouterLink, TranslatePipe, ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent {
  private readonly scroll = inject(ScrollService);
  private readonly destroyRef = inject(DestroyRef);

  /** Hero background video sources (WebM first — browsers pick the first supported). */
  protected readonly heroVideoWebm = 'assets/images/content/hero-optimized.webm';
  protected readonly heroVideoMp4 = 'assets/images/content/hero-optimized.mp4';
  /** First-frame poster: shown before the video loads, on mobile, and when autoplay is blocked. */
  protected readonly heroPoster = 'assets/images/content/hero-poster.jpg';

  /** On small screens show the static poster instead of the heavy video (bandwidth).
   *  Seeded synchronously (CSR — `window` is available) so mobile never flashes the
   *  video, then kept in sync on resize/rotate from afterNextRender (see constructor). */
  protected readonly isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  constructor() {
    afterNextRender(() => {
      // Keep the video/poster switch correct across resize + orientation change.
      this.isMobile.set(window.innerWidth < 768);
      fromEvent(window, 'resize')
        .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.isMobile.set(window.innerWidth < 768));
    });
  }

  /** Smoothly scrolls to a section of this page (no `#hash` in the URL). */
  protected scrollTo(sectionId: string): void {
    void this.scroll.scrollToSection('/', sectionId);
  }
}
