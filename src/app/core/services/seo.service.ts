/*
 * EN: Per-route SEO service. On every navigation it reads the deepest route's
 *     `data.seo` ({ titleKey, descriptionKey, … }), resolves the keys through the
 *     translation layer and writes <title>, meta description and Open Graph /
 *     Twitter tags. Re-applies on language switch so metadata stays localized.
 * RU: Сервис SEO по маршрутам. При каждой навигации читает `data.seo` самого
 *     глубокого маршрута ({ titleKey, descriptionKey, … }), разрешает ключи через
 *     слой переводов и пишет <title>, meta description и теги Open Graph/Twitter.
 *     Повторно применяет при смене языка, чтобы метаданные оставались локализованы.
 */
import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { COMPANY_INFO } from '@core/config/company-info';
import { TranslationService } from '@core/i18n/translation.service';
import { filter } from 'rxjs';

/** Canonical production origin for absolute SEO URLs (no trailing slash). */
const SITE_URL = COMPANY_INFO.siteUrl;
/** Default social-share image (absolute) when a route declares no `ogImage`. */
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/content/hero-poster.jpg`;

/** SEO metadata attached to a route via its `data.seo`. Copy fields are i18n keys. */
export interface SeoMetadata {
  /** Translation key for the document title. */
  readonly titleKey: string;
  /** Translation key for the meta description / og:description. */
  readonly descriptionKey: string;
  /** Absolute or root-relative Open Graph image URL. */
  readonly ogImage?: string;
  /** Open Graph type (defaults to `website`). */
  readonly ogType?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translation = inject(TranslationService);
  private readonly document = inject(DOCUMENT);

  /** SEO metadata of the currently active route (null when the route declares none). */
  private readonly metadata = signal<SeoMetadata | null>(null);

  constructor() {
    // Re-resolve and re-apply whenever the route's metadata or the language changes.
    effect(() => {
      const metadata = this.metadata();
      // Establish a dependency on the active language so copy re-localizes on switch.
      this.translation.currentLanguage();
      if (metadata) {
        this.apply(metadata);
      }
    });
  }

  /** Starts listening to navigation events. Call once during app initialization. */
  init(): void {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.metadata.set(this.resolveDeepestSeo());
    });
  }

  /** Walks the activated route tree to the leaf and returns its `data.seo`, if any. */
  private resolveDeepestSeo(): SeoMetadata | null {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return (route.data['seo'] as SeoMetadata | undefined) ?? null;
  }

  /** Writes the title, description and social tags for the given metadata. */
  private apply(metadata: SeoMetadata): void {
    const title = this.translation.translate(metadata.titleKey);
    const description = this.translation.translate(metadata.descriptionKey);
    const language = this.translation.currentLanguage();
    const locale = language === 'de' ? 'de_DE' : 'en_US';
    const altLocale = language === 'de' ? 'en_US' : 'de_DE';
    // Canonical/share URLs use the production origin + current path (never the
    // dev/localhost host), so crawlers index the real address regardless of build.
    const path = this.router.url.split(/[?#]/)[0];
    const canonical = `${SITE_URL}${path === '/' ? '' : path}`;
    const image = this.absolute(metadata.ogImage) ?? DEFAULT_OG_IMAGE;

    this.title.setTitle(title);

    const tags: Record<string, string>[] = [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: metadata.ogType ?? 'website' },
      { property: 'og:site_name', content: 'NEOMATTEN' },
      { property: 'og:url', content: canonical },
      { property: 'og:locale', content: locale },
      { property: 'og:locale:alternate', content: altLocale },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@neomattenberlin' },
      { name: 'twitter:url', content: canonical },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'geo.region', content: 'DE' },
      { name: 'geo.placename', content: 'Berlin' },
    ];

    for (const tag of tags) {
      this.meta.updateTag(tag);
    }

    // Canonical + hreflang alternates (DE/EN share the same URL; language is a
    // runtime UI switch, so x-default points at the same canonical address).
    this.setLink('seo-canonical', { rel: 'canonical', href: canonical });
    this.setLink('seo-alt-de', { rel: 'alternate', hreflang: 'de', href: canonical });
    this.setLink('seo-alt-en', { rel: 'alternate', hreflang: 'en', href: canonical });
    this.setLink('seo-alt-default', { rel: 'alternate', hreflang: 'x-default', href: canonical });
  }

  /** Promotes a root-relative asset path to an absolute production URL. */
  private absolute(url: string | undefined): string | null {
    if (!url) {
      return null;
    }
    if (/^https?:\/\//.test(url)) {
      return url;
    }
    return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  /** Creates or updates an identified <link> in <head> (canonical / hreflang). */
  private setLink(id: string, attrs: { rel: string; href: string; hreflang?: string }): void {
    let link = this.document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.id = id;
      this.document.head.appendChild(link);
    }
    link.setAttribute('rel', attrs.rel);
    link.setAttribute('href', attrs.href);
    if (attrs.hreflang) {
      link.setAttribute('hreflang', attrs.hreflang);
    }
  }
}
