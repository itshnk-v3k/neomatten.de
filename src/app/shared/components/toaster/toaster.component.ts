/*
 * EN: Toaster for the shared UI kit. A thin wrapper around ngx-sonner's toaster
 *     that pairs with the app-wide ToastService; mount it once in the app shell.
 *     Position is responsive: top-right (stacking downward) on md+ and top-center
 *     on mobile, driven by an `isMobile` signal that tracks the 768px breakpoint
 *     on resize (debounced). Toasts render above every overlay (z-index 2200).
 * RU: Тостер общего UI-кита. Тонкая обёртка над тостером ngx-sonner, работающая
 *     в паре с глобальным ToastService; размещается один раз в оболочке. Позиция
 *     адаптивна: справа сверху (со стеком вниз) на md+ и сверху по центру на
 *     мобильных — через сигнал `isMobile`, отслеживающий брейкпоинт 768px при
 *     ресайзе (с дебаунсом). Тосты рендерятся поверх всех оверлеев (z-index 2200).
 */
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxSonnerToaster } from 'ngx-sonner';
import { debounceTime, fromEvent, map, startWith } from 'rxjs';

/** Below this width (px) toasts switch to top-center; at/above it, top-right. */
const MOBILE_BREAKPOINT = 768;

@Component({
  selector: 'nm-toaster',
  imports: [NgxSonnerToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.scss',
})
export class ToasterComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** True under the md breakpoint; recomputed on (debounced) window resize. */
  protected readonly isMobile = this.isBrowser
    ? toSignal(
        fromEvent(window, 'resize').pipe(
          debounceTime(100),
          map(() => window.innerWidth < MOBILE_BREAKPOINT),
          startWith(window.innerWidth < MOBILE_BREAKPOINT)
        ),
        { initialValue: window.innerWidth < MOBILE_BREAKPOINT }
      )
    : signal(false);
}
