/*
 * EN: OAuth callback landing page. The backend redirects here after a Google /
 *     Facebook sign-in with a one-time `code` (never the tokens themselves).
 *     This exchanges the code for the real JWT pair via AuthService, stores the
 *     session, and forwards to the account dashboard. Any failure (missing code,
 *     provider-denied `error` param, expired/reused code) shows a friendly error
 *     with a link back to the login page — never a raw error or blank screen.
 * RU: Посадочная страница OAuth-редиректа. Бэкенд возвращает сюда после входа
 *     через Google / Facebook с одноразовым `code` (не с самими токенами). Здесь
 *     код обменивается на реальную пару JWT через AuthService, сессия
 *     сохраняется, и происходит переход в личный кабинет. При любой ошибке
 *     (нет кода, отказ провайдера, истёкший/использованный код) — понятное
 *     сообщение и ссылка на страницу входа, без сырых ошибок и пустого экрана.
 */
import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-auth-callback-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-callback-page.component.html',
})
export class AuthCallbackPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  /** True once the exchange has failed (shows the error + retry link). */
  protected readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    // Provider denied consent (?error=access_denied) or no code came back.
    if (params.get('error') || !code) {
      this.failed.set(true);
      return;
    }
    try {
      await this.auth.exchangeOAuthCode(code);
      await this.router.navigateByUrl('/account');
    } catch {
      this.failed.set(true);
    }
  }
}
