/*
 * i18n primitives for the admin app's own UI chrome (sidebar, header, page
 * titles, buttons, toasts, dialogs). This is a lightweight static layer,
 * separate from the database-backed Translation model used for public-site
 * content — the two never mix.
 */

/** Supported admin UI languages, Russian first (the default). */
export type AdminLanguage = 'ru' | 'de' | 'en';

/** All selectable admin UI languages, in switcher display order. */
export const ADMIN_LANGUAGES: readonly AdminLanguage[] = ['ru', 'de', 'en'] as const;

/** Default admin UI language when nothing is persisted yet. */
export const DEFAULT_ADMIN_LANGUAGE: AdminLanguage = 'ru';

/** localStorage key persisting the chosen admin UI language. */
export const ADMIN_LANGUAGE_STORAGE_KEY = 'na_admin_lang';
