/*
 * `t` pipe — resolves an admin UI-chrome key to the active language's string,
 * e.g. {{ 'nav.orders' | t }}. Optional params interpolate `{token}`
 * placeholders, e.g. {{ 'translations.renameNewKeyAria' | t: { key } }}.
 * Impure so it re-resolves when the active-language signal changes (OnPush-safe:
 * the signal read inside transform registers the view as a reactive consumer).
 */
import { inject, Pipe, type PipeTransform } from '@angular/core';

import { AdminI18nService } from './admin-i18n.service';

@Pipe({
  name: 't',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(AdminI18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
