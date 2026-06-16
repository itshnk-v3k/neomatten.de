/*
 * EN: Home product-categories section. Three cards (mats, EVA bags, cushions)
 *     linking into the catalog. Shows skeletons until first paint settles.
 * RU: Секция категорий товаров главной. Три карточки (коврики, EVA-сумки,
 *     подушки) со ссылками в каталог. Показывает скелетоны до первой отрисовки.
 */
import { NgOptimizedImage } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MediaService } from '@core/services/media.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * A product category card on the home page. Mirrors the /products overview:
 * clickable cards carry a `route` + CTA `linkKey`; `comingSoon` cards are
 * non-clickable and show a badge instead.
 */
interface CategoryCard {
  readonly titleKey: string;
  readonly descKey: string;
  readonly image: string | null;
  readonly linkKey?: string;
  readonly route?: string;
  readonly comingSoon?: boolean;
}

@Component({
  selector: 'nm-home-categories',
  imports: [
    NgOptimizedImage,
    RouterLink,
    TranslatePipe,
    RevealOnScrollDirective,
    SkeletonComponent,
    ImagePlaceholderComponent,
    ButtonDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent {
  private readonly media = inject(MediaService);

  /** Local loading flag (no backing service): shows skeletons until first paint settles. */
  protected readonly loading = signal(true);

  // TODO(admin): every image below is a placeholder routed through MediaService.
  // Each is a content slot the admin will fill with an uploaded MediaAsset;
  // swapping is a one-line change in MediaService (getPlaceholder → media API).

  /**
   * Product category cards — kept in sync with the /products overview page:
   * EVA car mats (→ /catalog) and EVA bags (→ /eva-bags) are clickable; leather
   * bags and cushions are "coming soon" (non-clickable). Images are admin-managed
   * placeholders for now.
   */
  protected readonly categories: readonly CategoryCard[] = [
    {
      titleKey: 'home_category_mats_title',
      descKey: 'home_category_mats_text',
      linkKey: 'home_category_mats_link',
      image: this.media.getPlaceholder(500, 300, 'neomatten-mats'),
      route: '/catalog',
    },
    {
      titleKey: 'home_category_bags_title',
      descKey: 'home_category_bags_text',
      linkKey: 'home_category_bags_link',
      image: this.media.getPlaceholder(500, 300, 'neomatten-evabags'),
      route: '/eva-bags',
    },
    {
      titleKey: 'home_category_leather_title',
      descKey: 'home_category_leather_text',
      image: this.media.getPlaceholder(500, 300, 'neomatten-leather'),
      comingSoon: true,
    },
    {
      titleKey: 'home_category_cushions_title',
      descKey: 'home_category_cushions_text',
      image: this.media.getPlaceholder(500, 300, 'neomatten-cushions'),
      comingSoon: true,
    },
  ];

  /**
   * EN: Indices of category images that failed to load → render the placeholder.
   * RU: Индексы изображений категорий, которые не загрузились → заглушка.
   */
  private readonly failed = signal<ReadonlySet<number>>(new Set());

  protected hasFailed(i: number): boolean {
    return this.failed().has(i);
  }

  protected onImageError(i: number): void {
    this.failed.update(s => new Set(s).add(i));
  }

  constructor() {
    afterNextRender(() => setTimeout(() => this.loading.set(false), 600));
  }
}
