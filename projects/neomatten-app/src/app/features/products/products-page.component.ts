/*
 * EN: "Our Products" overview page (/products). Lists every product category as a
 *     card — available ones (EVA car mats, EVA bags, headrest cushions) link to
 *     their section/configurator; "coming soon" ones (leather bags, textile
 *     cushions) show a badge and aren't clickable. Image slots are placeholders
 *     until the admin/backend supplies real media. Reachable from header + menu.
 * RU: Обзорная страница «Наши продукты» (/products). Каждая категория — карточка:
 *     доступные (EVA-автоматы, EVA-сумки, подушки для подголовника) ведут в свой
 *     раздел/конфигуратор; «скоро» (кожаные сумки, текстильные подушки) показывают
 *     бейдж и некликабельны. Слоты под изображения — заглушки до поставки реальных
 *     медиа админкой/бэкендом. Доступна из хедера и мобильного меню.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideImage } from '@lucide/angular';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

interface ProductCategory {
  readonly titleKey: string;
  readonly descKey: string;
  /** Target route for clickable cards; omitted for "coming soon" (non-clickable) cards. */
  readonly route?: string;
  /** When true the card is non-clickable and shows a "Coming soon" badge. */
  readonly comingSoon?: boolean;
}

@Component({
  selector: 'nm-products-page',
  imports: [RouterLink, BreadcrumbComponent, ButtonDirective, TranslatePipe, LucideImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent {
  protected readonly categories: readonly ProductCategory[] = [
    { titleKey: 'products_mats_title', descKey: 'products_mats_desc', route: '/configurator' },
    { titleKey: 'products_eva_bags_title', descKey: 'products_eva_bags_desc', route: '/eva-bags' },
    {
      titleKey: 'products_cushions_title',
      descKey: 'products_cushions_desc',
      route: '/cushions',
    },
    {
      titleKey: 'products_leather_bags_title',
      descKey: 'products_leather_bags_desc',
      route: '/leather-bags',
      comingSoon: true,
    },
    {
      // Distinct from the available headrest cushions above — a separate product line.
      titleKey: 'products_textile_cushions_title',
      descKey: 'products_textile_cushions_desc',
      comingSoon: true,
    },
  ];
}
