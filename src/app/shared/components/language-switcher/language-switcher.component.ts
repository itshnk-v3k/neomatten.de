/*
 * EN: DE/EN language switcher. Reads the active language signal from
 *     TranslationService and switches on click; each option shows its pressed
 *     state via aria-pressed. Labels come from translation keys.
 * RU: Переключатель языка DE/EN. Читает сигнал активного языка из
 *     TranslationService и переключает по клику; каждая опция показывает
 *     состояние через aria-pressed. Метки берутся из ключей перевода.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { type Language } from '@core/i18n/language.model';
import { TranslationService } from '@core/i18n/translation.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly translation = inject(TranslationService);

  protected readonly languages = this.translation.availableLanguages;
  protected readonly current = this.translation.currentLanguage;

  protected select(language: Language): void {
    void this.translation.setLanguage(language);
  }

  protected labelKey(language: Language): string {
    return `language_${language}`;
  }
}
