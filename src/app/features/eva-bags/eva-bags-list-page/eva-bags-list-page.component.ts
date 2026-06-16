/*
 * EN: EVA bags subcategory listing (with-lid / without-lid). The `subcategory`
 *     input is bound from the route's `data` via withComponentInputBinding, so
 *     one component serves both /eva-bags/with-lid and /eva-bags/without-lid.
 *     Shows a grid of product cards filtered to that subcategory.
 * RU: Список подкатегории EVA-сумок (с крышкой / без крышки). Вход `subcategory`
 *     привязывается из `data` маршрута через withComponentInputBinding, поэтому
 *     один компонент обслуживает и /eva-bags/with-lid, и /eva-bags/without-lid.
 *     Показывает сетку карточек товаров, отфильтрованных по подкатегории.
 */
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ProductService } from '@core/services/product.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-eva-bags-list-page',
  imports: [BreadcrumbComponent, ProductCardComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './eva-bags-list-page.component.html',
  styleUrl: './eva-bags-list-page.component.scss',
})
export class EvaBagsListPageComponent {
  protected readonly products = inject(ProductService);

  /** 'with-lid' | 'without-lid' — bound from the route data. */
  readonly subcategory = input<string>('');

  /** Title key for the chosen subcategory. */
  readonly titleKey = input<string>('page_eva_bags_title');

  protected readonly items = computed(() =>
    this.products.byCategory('eva_bag', this.subcategory())
  );
}
