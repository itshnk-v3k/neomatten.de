/*
 * Admin navigation model. Single source of truth for the sidebar links and the
 * route → page-title mapping used by the header. Labels are i18n keys resolved
 * against AdminI18nService (admin UI-chrome language).
 */
export interface NavItem {
  /** Absolute route path (without leading slash for routerLink arrays). */
  readonly path: string;
  /** i18n key for the human-readable label (resolved via AdminI18nService). */
  readonly labelKey: string;
}

/** Primary sidebar navigation, in display order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: 'dashboard', labelKey: 'nav.dashboard' },
  { path: 'orders', labelKey: 'nav.orders' },
  { path: 'products', labelKey: 'nav.products' },
  { path: 'customers', labelKey: 'nav.customers' },
  { path: 'translations', labelKey: 'nav.translations' },
  { path: 'settings', labelKey: 'nav.settings' },
];

/** Resolves a URL to its page-title i18n key; falls back to the brand name key. */
export function pageTitleKeyFor(url: string): string {
  const segment = url.split('?')[0].split('/').filter(Boolean)[0];
  return NAV_ITEMS.find(item => item.path === segment)?.labelKey ?? 'app.title';
}
