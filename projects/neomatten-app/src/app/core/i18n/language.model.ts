/*
 * EN: i18n primitives — the supported UI languages and the translation
 *     namespaces (JSON files under assets/i18n/<lang>/) loaded at startup.
 * RU: Примитивы i18n — поддерживаемые языки интерфейса и пространства имён
 *     переводов (JSON-файлы в assets/i18n/<lang>/), загружаемые при старте.
 */

/** Supported UI languages. */
export type Language = 'de' | 'en';

/** All supported languages, in display order. */
export const LANGUAGES: readonly Language[] = ['de', 'en'] as const;

/**
 * Translation namespaces to load and merge into a single flat key→string map.
 * Add a namespace here (and the matching JSON files) as new sections are built.
 */
export const TRANSLATION_NAMESPACES: readonly string[] = ['common'] as const;

/** Cookie name under which the chosen language is persisted. */
export const LANGUAGE_COOKIE_KEY = 'nm_lang';

/** A flat dictionary: snake_case key → translated string. */
export type TranslationDictionary = Record<string, string>;
