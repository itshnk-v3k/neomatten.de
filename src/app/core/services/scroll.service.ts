/*
 * EN: Smooth in-page scrolling for navigation. Given a route + section id, it
 *     scrolls to that element when already on the page, or navigates to the
 *     route first and scrolls once the view has rendered. No `#hash` is added to
 *     the URL — used by the header, mobile menu and footer section links.
 * RU: Плавная прокрутка к секциям для навигации. По маршруту + id секции
 *     прокручивает к элементу, если страница уже открыта, иначе сначала
 *     переходит на маршрут и прокручивает после отрисовки. В URL не добавляется
 *     `#hash` — используется хедером, мобильным меню и футером.
 */
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  /**
   * Scrolls to `sectionId` on `path`. If the app is already on `path` it scrolls
   * immediately; otherwise it navigates there first, then scrolls after the new
   * page has rendered. Never mutates the URL with a fragment.
   */
  async scrollToSection(path: string, sectionId: string): Promise<void> {
    const currentPath = this.router.url.split(/[?#]/)[0];
    if (currentPath !== path) {
      await this.router.navigateByUrl(path);
    }
    this.scrollIntoView(sectionId);
  }

  private scrollIntoView(sectionId: string): void {
    const view = this.document.defaultView;
    const scroll = (): void => {
      const element = this.document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    // Defer one frame so a freshly navigated page is in the DOM before we scroll.
    if (view) {
      view.requestAnimationFrame(scroll);
    } else {
      scroll();
    }
  }
}
