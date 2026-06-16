/*
 * EN: Shared navigation link definitions used by the header (desktop), the
 *     mobile menu, and the footer, so all stay in sync. Labels are translation
 *     keys. Most links are real routes (routerLink); links that target a section
 *     of the home page carry a `sectionId` instead and scroll there via the
 *     ScrollService (no `#hash` in the URL).
 * RU: Общие определения навигационных ссылок для хедера (десктоп), мобильного
 *     меню и футера, чтобы всё было синхронно. Метки — ключи перевода. Большинство
 *     ссылок — реальные маршруты (routerLink); ссылки на секцию главной страницы
 *     несут `sectionId` и прокручивают туда через ScrollService (без `#hash` в URL).
 */

export interface NavLink {
  /** Translation key for the link label. */
  readonly labelKey: string;
  /** Router path (the page the link belongs to; '/' for home-page sections). */
  readonly path: string;
  /** Optional home-page section id; when set the link scrolls instead of routing. */
  readonly sectionId?: string;
}

/** Primary navigation shown in the header and mobile menu. */
export const PRIMARY_NAV: readonly NavLink[] = [
  { labelKey: 'header_nav_configurator', path: '/configurator' },
  { labelKey: 'header_nav_advantages', path: '/', sectionId: 'vorteile' },
  { labelKey: 'header_nav_work', path: '/', sectionId: 'arbeiten' },
  { labelKey: 'header_nav_products', path: '/products' },
  { labelKey: 'header_nav_material', path: '/eva-material' },
  { labelKey: 'header_nav_faq', path: '/faq' },
  { labelKey: 'header_nav_contact', path: '/contact' },
] as const;

/** Navigation column shown in the footer. */
export const FOOTER_NAV: readonly NavLink[] = [
  { labelKey: 'header_nav_configurator', path: '/configurator' },
  { labelKey: 'header_nav_work', path: '/', sectionId: 'arbeiten' },
  { labelKey: 'header_nav_material', path: '/eva-material' },
  { labelKey: 'header_nav_faq', path: '/faq' },
] as const;

/** Legal links shown in the footer. */
export const FOOTER_LEGAL: readonly NavLink[] = [
  { labelKey: 'footer_imprint', path: '/imprint' },
  { labelKey: 'footer_privacy', path: '/privacy-policy' },
  { labelKey: 'footer_terms', path: '/terms' },
  { labelKey: 'footer_withdrawal', path: '/withdrawal' },
] as const;
