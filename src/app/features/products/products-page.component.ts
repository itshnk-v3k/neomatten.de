/*
 * EN: "Our Products" overview page (/products). Lists the four product
 *     categories as cards (EVA car mats, EVA bags, leather bags, cushions), each
 *     linking to its section/configurator. Image slots are placeholders until the
 *     admin/backend supplies real media. Reachable from the header + mobile menu.
 * RU: Обзорная страница «Наши продукты» (/products). Показывает четыре категории
 *     карточками (EVA-автоматы, EVA-сумки, кожаные сумки, подушки), каждая ведёт в
 *     свой раздел/конфигуратор. Слоты под изображения — заглушки до поставки
 *     реальных медиа админкой/бэкендом. Доступна из хедера и мобильного меню.
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
  readonly route: string;
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
      titleKey: 'products_leather_bags_title',
      descKey: 'products_leather_bags_desc',
      route: '/leather-bags',
      comingSoon: true,
    },
    {
      titleKey: 'products_cushions_title',
      descKey: 'products_cushions_desc',
      route: '/cushions',
      comingSoon: true,
    },
  ];
}
