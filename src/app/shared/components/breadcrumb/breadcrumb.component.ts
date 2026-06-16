/*
 * EN: Breadcrumb trail. Derives "Home › Category › Page" from the current URL
 *     segments, mapping known segments to translate keys and humanizing unknown
 *     dynamic ones (brand/product ids). Each crumb except the last is a
 *     routerLink; the last is the current page. Pages with a dynamic final
 *     segment can override its text via [currentLabel] (e.g. a product name).
 * RU: Цепочка «хлебных крошек». Выводит «Главная › Категория › Страница» из
 *     сегментов текущего URL, сопоставляя известные сегменты ключам перевода и
 *     очеловечивая неизвестные динамические (id марки/товара). Каждая крошка,
 *     кроме последней, — routerLink; последняя — текущая страница. Страницы с
 *     динамическим последним сегментом могут переопределить текст через
 *     [currentLabel] (например, название товара).
 */
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { LucideChevronRight } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { filter, map } from 'rxjs';

/** A single breadcrumb crumb. `labelKey` renders via translate; `label` is literal. */
interface Crumb {
  readonly labelKey?: string;
  readonly label?: string;
  /** Router path; absent for the current (last) page. */
  readonly link?: string;
}

/**
 * Known URL segment → label translate key. Unmapped segments (brand / product
 * ids) are humanized (kebab-case → Title Case). Reuses existing nav keys where
 * they exist; adds `breadcrumb_*` keys for the rest.
 */
const SEGMENT_LABELS: Record<string, string> = {
  configurator: 'header_nav_configurator',
  cart: 'breadcrumb_cart',
  account: 'breadcrumb_account',
  contact: 'header_nav_contact',
  faq: 'header_nav_faq',
  cushions: 'breadcrumb_cushions',
  'eva-bags': 'breadcrumb_eva_bags',
  'leather-bags': 'breadcrumb_leather_bags',
  'eva-material': 'header_nav_material',
  'with-lid': 'breadcrumb_with_lid',
  'without-lid': 'breadcrumb_without_lid',
  login: 'breadcrumb_login',
  register: 'breadcrumb_register',
  profile: 'breadcrumb_profile',
  password: 'breadcrumb_password',
  products: 'header_nav_products',
  imprint: 'footer_imprint',
  'privacy-policy': 'footer_privacy',
  terms: 'footer_terms',
  withdrawal: 'footer_withdrawal',
};

@Component({
  selector: 'nm-breadcrumb',
  imports: [RouterLink, LucideChevronRight, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumb.component.html',
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);

  /** Optional override for the last crumb's text (e.g. a resolved product name). */
  readonly currentLabel = input<string>('');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly crumbs = computed<Crumb[]>(() => {
    const path = this.url().split(/[?#]/)[0];
    const segments = path.split('/').filter(Boolean);
    const trail: Crumb[] = [{ labelKey: 'breadcrumb_home', link: '/' }];

    // Every crumb maps to a real navigable route: the trail is built purely from
    // URL segments, each non-last crumb linking to its accumulated path. No
    // synthetic group crumbs (e.g. a "Legal" parent) — they have no route.
    let acc = '';
    segments.forEach((segment, index) => {
      acc += `/${segment}`;
      const isLast = index === segments.length - 1;
      const override = isLast && this.currentLabel() ? this.currentLabel() : undefined;
      const labelKey = SEGMENT_LABELS[segment];
      trail.push({
        labelKey: override ? undefined : labelKey,
        label: override ?? (labelKey ? undefined : this.humanize(segment)),
        link: isLast ? undefined : acc,
      });
    });

    return trail;
  });

  /** kebab/encoded segment → readable Title Case (for brand / product ids). */
  private humanize(segment: string): string {
    return decodeURIComponent(segment)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
