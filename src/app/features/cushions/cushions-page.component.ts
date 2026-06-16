/*
 * EN: Cushions listing page. A responsive grid of headrest-cushion product
 *     cards from ProductService (category = cushion). Each card links to the
 *     shared product detail page and can add to the cart.
 * RU: Страница списка кисеней. Адаптивная сетка карточек кисеней на подголовник
 *     из ProductService (категория = cushion). Каждая карточка ведёт на общую
 *     страницу товара и может добавить в корзину.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProductService } from '@core/services/product.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-cushions-page',
  imports: [BreadcrumbComponent, ProductCardComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cushions-page.component.html',
  styleUrl: './cushions-page.component.scss',
})
export class CushionsPageComponent {
  protected readonly products = inject(ProductService);

  protected readonly items = computed(() => this.products.byCategory('cushion'));
}
