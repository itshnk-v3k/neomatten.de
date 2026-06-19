/*
 * EN: EVA-leather bags listing page. Opens directly to a grid of product cards
 *     (category = leather_bag) — no subcategory step. Cards link to the shared
 *     product detail page and can add to the cart.
 * RU: Страница списка сумок из EVA-кожи. Открывается сразу сеткой карточек
 *     товаров (категория = leather_bag) — без шага подкатегории. Карточки ведут
 *     на общую страницу товара и могут добавить в корзину.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProductService } from '@core/services/product.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-leather-bags-page',
  imports: [BreadcrumbComponent, ProductCardComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leather-bags-page.component.html',
  styleUrl: './leather-bags-page.component.scss',
})
export class LeatherBagsPageComponent {
  protected readonly products = inject(ProductService);

  protected readonly items = computed(() => this.products.byCategory('leather_bag'));
}
