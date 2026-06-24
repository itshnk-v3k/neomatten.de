/*
 * Admin navigation model. Single source of truth for the sidebar links and the
 * route → page-title mapping used by the header.
 */
export interface NavItem {
  /** Absolute route path (without leading slash for routerLink arrays). */
  readonly path: string;
  /** Human-readable label (German, the admin UI language). */
  readonly label: string;
}

/** Primary sidebar navigation, in display order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'orders', label: 'Bestellungen' },
  { path: 'products', label: 'Produkte' },
  { path: 'customers', label: 'Kunden' },
  { path: 'settings', label: 'Einstellungen' },
];

/** Resolves a URL to its page title; falls back to the brand name. */
export function pageTitleFor(url: string): string {
  const segment = url.split('?')[0].split('/').filter(Boolean)[0];
  return NAV_ITEMS.find(item => item.path === segment)?.label ?? 'Neomatten Admin';
}
