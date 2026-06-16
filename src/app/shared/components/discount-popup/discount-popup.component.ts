/*
 * EN: First-order 10% discount popup. Shows once per visitor, 15 seconds after
 *     load, on the first visit only — a `neomatten_discount_shown` flag in
 *     localStorage is set as soon as it appears, so it never shows again (even
 *     across sessions). Never shown to signed-in users. Mounted once in the Shell.
 * RU: Попап скидки 10% на первый заказ. Показывается один раз посетителю, через 15
 *     секунд после загрузки, только при первом визите — флаг
 *     `neomatten_discount_shown` в localStorage ставится сразу при показе, поэтому
 *     больше не появляется (даже между сессиями). Вошедшим не показывается.
 *     Монтируется один раз в оболочке.
 */
import type { OnDestroy } from '@angular/core';
import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

const SHOWN_KEY = 'neomatten_discount_shown';
const DELAY_MS = 15000;

@Component({
  selector: 'nm-discount-popup',
  imports: [DialogComponent, ButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discount-popup.component.html',
})
export class DiscountPopupComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly open = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    afterNextRender(() => {
      if (this.auth.isAuthenticated() || this.hasShown()) return;
      this.timer = setTimeout(() => this.trigger(), DELAY_MS);
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected register(): void {
    this.open.set(false);
    void this.router.navigateByUrl('/account/register');
  }

  protected later(): void {
    this.open.set(false);
  }

  /** Shows the popup once and records the first-visit flag so it never repeats. */
  private trigger(): void {
    this.clearTimer();
    if (this.auth.isAuthenticated() || this.hasShown()) return;
    this.markShown();
    this.open.set(true);
  }

  private markShown(): void {
    try {
      localStorage.setItem(SHOWN_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }

  private hasShown(): boolean {
    try {
      return localStorage.getItem(SHOWN_KEY) === '1';
    } catch {
      return false;
    }
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
