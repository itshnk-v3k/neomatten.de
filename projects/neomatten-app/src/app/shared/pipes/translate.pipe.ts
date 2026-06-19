/*
 * EN: `translate` pipe — resolves a snake_case translation key to the active
 *     language's string, e.g. {{ 'header_nav_catalog' | translate }}. Optional
 *     params interpolate `{token}` placeholders, e.g.
 *     {{ 'reviews_count' | translate: { count: 847 } }}. Impure so it
 *     re-resolves when the active language signal changes.
 * RU: Пайп `translate` — преобразует snake_case-ключ перевода в строку активного
 *     языка, напр. {{ 'header_nav_catalog' | translate }}. Необязательные параметры
 *     подставляют плейсхолдеры `{token}`, напр.
 *     {{ 'reviews_count' | translate: { count: 847 } }}. Impure, чтобы
 *     пересчитываться при смене сигнала активного языка.
 */
import { inject, Pipe, type PipeTransform } from '@angular/core';
import { TranslationService } from '@core/i18n/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translation.translate(key, params);
  }
}
