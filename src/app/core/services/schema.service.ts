/*
 * EN: Structured-data (JSON-LD) service. Injects a site-wide Organization +
 *     WebSite graph once, then swaps a per-page <script type="application/ld+json">
 *     on every navigation based on the active route's `data.schema` hint
 *     (e.g. 'faq', 'product'). Removing the previous page script before writing
 *     the next one keeps exactly one page-level schema in the DOM at a time.
 * RU: Сервис структурированных данных (JSON-LD). Один раз внедряет общий граф
 *     Organization + WebSite, затем на каждой навигации подменяет постраничный
 *     <script type="application/ld+json"> по подсказке `data.schema` активного
 *     маршрута ('faq', 'product'). Перед записью следующего удаляет предыдущий,
 *     поэтому в DOM всегда не более одной постраничной схемы.
 */
import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { COMPANY_INFO } from '@core/config/company-info';
import { filter } from 'rxjs';

/** Route `data.schema` shape — declares which page-level schema to emit. */
export interface SchemaHint {
  /** Schema kind to render for the route. */
  readonly type: 'product' | 'faq';
  /** Product fields (used when `type === 'product'`). */
  readonly product?: {
    readonly name: string;
    readonly description: string;
    readonly price: string;
    readonly image?: string;
  };
}

const SITE = COMPANY_INFO.siteUrl;
const LD_TYPE = 'application/ld+json';

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  /** Element id for the single page-level schema script (replaced per route). */
  private static readonly PAGE_SCRIPT_ID = 'ld-json-page';
  /** Element id for the site-wide Organization/WebSite graph (written once). */
  private static readonly SITE_SCRIPT_ID = 'ld-json-site';

  /** Writes the site-wide graph, then keeps the page schema in sync per route. */
  init(): void {
    this.writeSiteGraph();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.applyPageSchema();
    });
  }

  /** Organization + WebSite graph — emitted once on every page of the site. */
  private writeSiteGraph(): void {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE}/#organization`,
          name: COMPANY_INFO.brand,
          url: SITE,
          logo: `${SITE}/assets/images/logo/neomat_full_transparent.png`,
          email: COMPANY_INFO.email,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: COMPANY_INFO.phone.replace(/\s/g, ''),
            contactType: 'customer service',
            availableLanguage: ['German', 'English'],
          },
          sameAs: COMPANY_INFO.social.map(s => s.url),
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE}/#website`,
          url: SITE,
          name: COMPANY_INFO.brand,
          publisher: { '@id': `${SITE}/#organization` },
          inLanguage: ['de', 'en'],
        },
      ],
    };
    this.upsertScript(SchemaService.SITE_SCRIPT_ID, graph);
  }

  /** Resolves the deepest route's `data.schema` and emits the matching JSON-LD. */
  private applyPageSchema(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const hint = route.data['schema'] as SchemaHint | undefined;
    if (!hint) {
      this.removeScript(SchemaService.PAGE_SCRIPT_ID);
      return;
    }
    if (hint.type === 'product' && hint.product) {
      this.upsertScript(SchemaService.PAGE_SCRIPT_ID, {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: hint.product.name,
        description: hint.product.description,
        brand: { '@type': 'Brand', name: COMPANY_INFO.brand },
        ...(hint.product.image ? { image: hint.product.image } : {}),
        offers: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: hint.product.price,
          availability: 'https://schema.org/InStock',
          seller: { '@id': `${SITE}/#organization` },
        },
      });
    }
  }

  /**
   * Publishes a FAQPage schema for the given question/answer pairs. Called by the
   * page that owns the FAQ content (the questions live in i18n, so the resolved
   * strings come from the component, not from static route data).
   */
  setFaq(entries: readonly { question: string; answer: string }[]): void {
    if (!entries.length) {
      this.removeScript(SchemaService.PAGE_SCRIPT_ID);
      return;
    }
    this.upsertScript(SchemaService.PAGE_SCRIPT_ID, {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: entries.map(e => ({
        '@type': 'Question',
        name: e.question,
        acceptedAnswer: { '@type': 'Answer', text: e.answer },
      })),
    });
  }

  /** Creates or replaces the JSON-LD script with the given id. */
  private upsertScript(id: string, data: unknown): void {
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.type = LD_TYPE;
      script.id = id;
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  /** Removes the script with the given id if present. */
  private removeScript(id: string): void {
    this.document.getElementById(id)?.remove();
  }
}
