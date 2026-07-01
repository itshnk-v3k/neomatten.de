/*
 * EN: Signal-based translation service. Loads/merges per-language JSON
 *     dictionaries, exposes the active language as a signal, resolves snake_case
 *     keys, and persists the choice in a cookie. Designed so an admin panel can
 *     later edit any key's copy without code changes.
 * RU: Сервис переводов на сигналах. Загружает и объединяет JSON-словари по
 *     языкам, хранит активный язык как сигнал, разрешает snake_case-ключи и
 *     сохраняет выбор в cookie. Спроектирован так, чтобы админка позже могла
 *     менять текст любого ключа без изменения кода.
 */
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import { CookieService } from 'ngx-cookie-service';
import { firstValueFrom } from 'rxjs';

import {
  type Language,
  LANGUAGE_COOKIE_KEY,
  LANGUAGES,
  TRANSLATION_NAMESPACES,
  type TranslationDictionary,
} from './language.model';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly cookies = inject(CookieService);

  /** Loaded dictionaries, keyed by language. */
  private readonly dictionaries = signal<Partial<Record<Language, TranslationDictionary>>>({});

  /** Currently active UI language. */
  private readonly language = signal<Language>(this.resolveInitialLanguage());

  /** Read-only active language signal (for headers / switchers). */
  readonly currentLanguage = this.language.asReadonly();

  /** Active dictionary as a computed signal. */
  private readonly activeDictionary = computed<TranslationDictionary>(
    () => this.dictionaries()[this.language()] ?? {}
  );

  /** All selectable languages. */
  readonly availableLanguages = LANGUAGES;

  /**
   * Loads the initial language dictionary. Call once during app initialization.
   */
  async init(): Promise<void> {
    await this.loadLanguage(this.language());
  }

  /**
   * Resolves a translation key to its string, falling back to the key itself.
   * Optional `params` replace `{token}` placeholders in the resolved string
   * (e.g. `translate('reviews_count', { count: 847 })` → "from 847 reviews").
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const value = this.activeDictionary()[key] ?? key;
    if (!params) {
      return value;
    }
    return value.replace(/\{(\w+)\}/g, (_, token: string) =>
      token in params ? String(params[token]) : `{${token}}`
    );
  }

  /** Switches the active language (loading its dictionary if needed) and persists it. */
  async setLanguage(language: Language): Promise<void> {
    if (!LANGUAGES.includes(language)) {
      return;
    }
    await this.loadLanguage(language);
    this.language.set(language);
    this.cookies.set(LANGUAGE_COOKIE_KEY, language, { path: '/', expires: 365 });
    document.documentElement.lang = language;
  }

  /**
   * Loads a language dictionary (once). The live copy comes from the API
   * (GET /api/translations/:locale, admin-editable via draft/publish). If the
   * API is unreachable or returns nothing, we fall back to the bundled static
   * JSON so the site never renders blank when the backend is down.
   */
  private async loadLanguage(language: Language): Promise<void> {
    if (this.dictionaries()[language]) {
      return;
    }
    let merged: TranslationDictionary;
    try {
      const live = await firstValueFrom(
        this.http.get<TranslationDictionary>(`/api/translations/${language}`)
      );
      if (!live || Object.keys(live).length === 0) {
        throw new Error('empty translation dictionary');
      }
      merged = live;
    } catch {
      merged = await this.loadStaticLanguage(language);
    }
    this.dictionaries.update(current => ({ ...current, [language]: merged }));
  }

  /** Fallback: loads and merges the bundled static namespace files. */
  private async loadStaticLanguage(language: Language): Promise<TranslationDictionary> {
    const files = await Promise.all(
      TRANSLATION_NAMESPACES.map(namespace =>
        firstValueFrom(
          this.http.get<TranslationDictionary>(`/assets/i18n/${language}/${namespace}.json`)
        )
      )
    );
    return files.reduce<TranslationDictionary>((acc, dict) => ({ ...acc, ...dict }), {});
  }

  /** Picks the initial language from the cookie, falling back to the env default. */
  private resolveInitialLanguage(): Language {
    const stored = this.cookies.get(LANGUAGE_COOKIE_KEY) as Language;
    return LANGUAGES.includes(stored) ? stored : environment.defaultLanguage;
  }
}
