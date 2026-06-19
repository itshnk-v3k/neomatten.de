/*
 * EN: Body scroll-lock for modals/sheets/popups. Uses a counter so nested
 *     overlays (e.g. auth dialog opened from the payment dialog) only release
 *     the lock when the last one closes. Locks via `position: fixed` + negative
 *     `top` (the iOS-Safari-safe technique, since iOS ignores `overflow:hidden`
 *     on body) and restores the saved scroll position on release.
 * RU: Блокировка прокрутки body для модалок/панелей/попапов. Использует счётчик,
 *     чтобы вложенные оверлеи (например, диалог входа поверх диалога оплаты)
 *     снимали блокировку только при закрытии последнего. Блокирует через
 *     `position: fixed` + отрицательный `top` (безопасно для iOS Safari, который
 *     игнорирует `overflow:hidden` на body) и восстанавливает прокрутку при снятии.
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private count = 0;
  private savedScrollY = 0;

  /** Locks body scroll (idempotent per overlay — increments the counter). */
  lock(): void {
    if (typeof document === 'undefined') return;
    if (this.count === 0) {
      this.savedScrollY = window.scrollY;
      const body = document.body;
      body.style.top = `-${this.savedScrollY}px`;
      body.style.position = 'fixed';
      body.style.width = '100%';
      body.classList.add('overflow-hidden');
    }
    this.count++;
  }

  /** Releases one lock; restores scroll only when the last overlay closes. */
  unlock(): void {
    if (typeof document === 'undefined' || this.count === 0) return;
    this.count--;
    // Only the last overlay to close restores scroll (nested overlays — e.g. the
    // auth dialog opened from the payment dialog — keep the lock until the counter
    // reaches 0). Restoring AFTER removing the fixed positioning avoids the iOS
    // Safari jump-to-top bug; `behavior: 'instant'` prevents an animated scroll.
    if (this.count === 0) {
      const scrollY = this.savedScrollY;
      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.classList.remove('overflow-hidden');
      window.scrollTo({ top: scrollY, behavior: 'instant' });
      this.savedScrollY = 0;
    }
  }
}
