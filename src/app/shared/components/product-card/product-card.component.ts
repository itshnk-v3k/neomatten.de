/*
 * EN: Product card for the simple-product listings (cushions, EVA bags, leather
 *     bags). Shows the thumbnail, name, short description and price, links to the
 *     product detail page, and has an "Add to cart" button (CartService + toast).
 * RU: Карточка товара для списков простых товаров (кисени, EVA-сумки, кожаные
 *     сумки). Показывает миниатюру, название, краткое описание и цену, ведёт на
 *     страницу товара и имеет кнопку «В корзину» (CartService + тост).
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { productCategoryPath, type ProductDTO } from '@core/models/product.model';
import { CartService } from '@core/services/cart.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { createAsyncAction } from '@shared/utils/async-action.util';

@Component({
  selector: 'nm-product-card',
  imports: [RouterLink, NgOptimizedImage, ButtonDirective, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly product = input.required<ProductDTO>();

  /** Flips true once the thumbnail fires its `load` event; hides the skeleton overlay. */
  protected readonly imageLoaded = signal(false);

  protected readonly detailLink = computed(() => [
    productCategoryPath(this.product().category),
    this.product().id,
  ]);

  /**
   * Add-to-cart is a synchronous cart signal update, so the minDurationMs floor
   * debounces a rapid second click (a plain guard would reset in the same tick).
   */
  protected readonly addToCartAction = createAsyncAction(
    () => {
      const merged = this.cart.addProduct(this.product());
      this.toast.success(merged ? 'cart_quantity_updated' : 'product_added_to_cart');
    },
    { minDurationMs: 500 }
  );
}
