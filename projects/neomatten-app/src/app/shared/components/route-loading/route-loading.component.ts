/*
 * EN: Top-of-viewport route progress bar (YouTube/GitHub style). A thin brand-red
 *     bar that animates 0→70% on NavigationStart, jumps to 100% on
 *     NavigationEnd/Cancel/Error, then fades out. Sits above every overlay.
 *     Mounted once in the ShellComponent.
 * RU: Полоса прогресса навигации сверху экрана (в стиле YouTube/GitHub). Тонкая
 *     фирменно-красная полоса: 0→70% при NavigationStart, 100% при
 *     NavigationEnd/Cancel/Error, затем исчезает. Поверх всех слоёв. Монтируется
 *     один раз в ShellComponent.
 */
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';

@Component({
  selector: 'nm-route-loading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-loading.component.html',
  styleUrl: './route-loading.component.scss',
})
export class RouteLoadingComponent {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Bar fill (0–100%). */
  protected readonly progress = signal(0);
  /** Whether the bar is shown (drives the fade-out). */
  protected readonly visible = signal(false);

  private hideTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.start();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.complete();
      }
    });
  }

  /** Begins the bar: show at 0, then ease toward 70% while the route loads. */
  private start(): void {
    if (!this.isBrowser) {
      return;
    }
    clearTimeout(this.hideTimer);
    this.visible.set(true);
    this.progress.set(0);
    // Two frames so the 0→70 width change actually transitions.
    requestAnimationFrame(() => requestAnimationFrame(() => this.progress.set(70)));
  }

  /** Finishes the bar: fill to 100%, then fade out and reset. */
  private complete(): void {
    if (!this.isBrowser) {
      return;
    }
    this.progress.set(100);
    this.hideTimer = setTimeout(() => {
      this.visible.set(false);
      this.progress.set(0);
    }, 300);
  }
}
