/*
 * Signal-based i18n service for the admin app's own UI chrome. Bundles three
 * static JSON dictionaries (ru/de/en) and resolves dot-nested keys against the
 * currently selected language. The active language is a signal persisted to
 * localStorage, so any template reading `t()` / `tp()` (directly or via the
 * translate pipe) re-renders on switch — OnPush-safe.
 *
 * Scope: admin interface chrome only. This has nothing to do with the
 * database-backed Translation model powering public-site content.
 */
import { computed, Injectable, signal } from '@angular/core';

import de from '../../../assets/i18n/de.json';
import en from '../../../assets/i18n/en.json';
import ru from '../../../assets/i18n/ru.json';
import {
  ADMIN_LANGUAGE_STORAGE_KEY,
  ADMIN_LANGUAGES,
  type AdminLanguage,
  DEFAULT_ADMIN_LANGUAGE,
} from './admin-language.model';

/** A nested dictionary: string leaves, plus objects for plural forms. */
type Dictionary = Record<string, unknown>;

/** CLDR-style plural categories used by the bundled dictionaries. */
type PluralCategory = 'one' | 'few' | 'many' | 'other';

const DICTIONARIES: Record<AdminLanguage, Dictionary> = {
  ru: ru as Dictionary,
  de: de as Dictionary,
  en: en as Dictionary,
};

@Injectable({ providedIn: 'root' })
export class AdminI18nService {
  private readonly language = signal<AdminLanguage>(this.resolveInitialLanguage());

  /** Read-only active language signal (for the switcher's pressed state). */
  readonly currentLanguage = this.language.asReadonly();

  /** All selectable languages, in display order. */
  readonly languages = ADMIN_LANGUAGES;

  /** Active dictionary as a computed signal (drives reactive re-resolution). */
  private readonly dictionary = computed<Dictionary>(() => DICTIONARIES[this.language()]);

  /** Switches the active language and persists it. */
  setLanguage(language: AdminLanguage): void {
    if (!ADMIN_LANGUAGES.includes(language)) {
      return;
    }
    this.language.set(language);
    try {
      localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore storage errors (private mode etc.)
    }
    document.documentElement.lang = language;
  }

  /**
   * Resolves a dot-nested key to its string, falling back to the key itself.
   * Optional `params` replace `{token}` placeholders in the resolved string.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const resolved = this.resolve(key);
    const value = typeof resolved === 'string' ? resolved : key;
    return this.interpolate(value, params);
  }

  /**
   * Pluralized lookup: `key` must resolve to an object of plural forms
   * (one/few/many/other). Selects the form for `count` in the active language,
   * interpolates `{count}` (plus any extra params), and falls back sensibly.
   */
  tp(key: string, count: number, params?: Record<string, string | number>): string {
    const node = this.resolve(key);
    let value = key;
    if (node && typeof node === 'object') {
      const forms = node as Partial<Record<PluralCategory, string>>;
      const category = this.pluralCategory(count);
      value = forms[category] ?? forms.other ?? forms.many ?? key;
    }
    return this.interpolate(value, { count, ...params });
  }

  private resolve(key: string): unknown {
    return key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node && typeof node === 'object' ? (node as Dictionary)[part] : undefined),
        this.dictionary()
      );
  }

  private interpolate(value: string, params?: Record<string, string | number>): string {
    if (!params) {
      return value;
    }
    return value.replace(/\{(\w+)\}/g, (_, token: string) =>
      token in params ? String(params[token]) : `{${token}}`
    );
  }

  /** CLDR plural category for `count` in the active language. */
  private pluralCategory(count: number): PluralCategory {
    const n = Math.abs(count);
    if (this.language() === 'ru') {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) {
        return 'one';
      }
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return 'few';
      }
      return 'many';
    }
    return n === 1 ? 'one' : 'other';
  }

  /** Picks the initial language from localStorage, else the default (ru). */
  private resolveInitialLanguage(): AdminLanguage {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(ADMIN_LANGUAGE_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    return ADMIN_LANGUAGES.includes(stored as AdminLanguage)
      ? (stored as AdminLanguage)
      : DEFAULT_ADMIN_LANGUAGE;
  }
}
