/*
 * Admin UI-chrome language switcher — a compact 3-way segmented control
 * (RU / DE / EN) shown in the header. Reads the active language signal from
 * AdminI18nService and switches on click; the pressed option is highlighted and
 * exposed via aria-pressed. Flag-free text labels avoid flag↔language mismatch.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AdminI18nService } from '../../core/i18n/admin-i18n.service';
import type { AdminLanguage } from '../../core/i18n/admin-language.model';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'na-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  template: `
    <div
      class="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-100 p-0.5"
      role="group"
      [attr.aria-label]="'app.language' | t">
      @for (language of languages; track language) {
        <button
          type="button"
          (click)="select(language)"
          [attr.aria-pressed]="current() === language"
          [class.bg-white]="current() === language"
          [class.text-primary]="current() === language"
          [class.shadow-sm]="current() === language"
          class="rounded-md px-2 py-1 text-xs font-semibold uppercase text-neutral-500 outline-none transition hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-primary/30">
          {{ language }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcherComponent {
  private readonly i18n = inject(AdminI18nService);

  protected readonly languages = this.i18n.languages;
  protected readonly current = this.i18n.currentLanguage;

  protected select(language: AdminLanguage): void {
    this.i18n.setLanguage(language);
  }
}
