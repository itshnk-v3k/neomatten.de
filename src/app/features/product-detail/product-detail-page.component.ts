/*
 * EN: Generic product detail page, shared by /cushions/:id, /eva-bags/:id and
 *     /leather-bags/:id. The `id` input is bound from the route param; the
 *     product is looked up in ProductService. Left: image gallery (main image +
 *     thumbnail strip). Right: name, description, specs, SKU, delivery info,
 *     price and add-to-cart. Breadcrumb shows the product name as the last crumb.
 * RU: Универсальная страница товара для /cushions/:id, /eva-bags/:id и
 *     /leather-bags/:id. Вход `id` привязан из параметра маршрута; товар берётся
 *     из ProductService. Слева — галерея (главное изображение + миниатюры).
 *     Справа — название, описание, характеристики, SKU, инфо о доставке, цена и
 *     добавление в корзину. В крошках название товара — последняя крошка.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CartService } from '@core/services/cart.service';
import { ProductService } from '@core/services/product.service';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { createAsyncAction } from '@shared/utils/async-action.util';

@Component({
  selector: 'nm-product-detail-page',
  imports: [
    NgOptimizedImage,
    BadgeComponent,
    BreadcrumbComponent,
    ButtonDirective,
    ImagePlaceholderComponent,
    SkeletonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail-page.component.html',
})
export class ProductDetailPageComponent {
  protected readonly products = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  /** Product id, bound from the route param. */
  readonly id = input.required<string>();

  protected readonly product = computed(() => this.products.byId(this.id()));

  /**
   * Active gallery image. Product images come from ProductDTO.images.
   * TODO(admin)/TODO(backend): those are admin-managed CDN URLs via `GET /api/products`.
   * Null (product has no images) → the template renders nm-image-placeholder.
   */
  protected readonly activeIndex = signal(0);
  protected readonly activeImage = computed<string | null>(
    () => this.product()?.images[this.activeIndex()] ?? this.product()?.images[0] ?? null
  );

  /**
   * EN: Flips true if the active image fails to load → render the placeholder.
   *     Reset whenever the active image changes (new index = fresh attempt).
   * RU: Становится true, если активное изображение не загрузилось → заглушка.
   *     Сбрасывается при смене активного изображения (новый индекс — новая попытка).
   */
  protected readonly imageFailed = signal(false);

  protected onImageError(): void {
    this.imageFailed.set(true);
  }

  protected select(index: number): void {
    this.activeIndex.set(index);
    this.imageFailed.set(false);
  }

  /**
   * Add-to-cart is a synchronous cart signal update, so the minDurationMs floor
   * debounces a rapid second click (a plain guard would reset in the same tick).
   */
  protected readonly addToCartAction = createAsyncAction(
    () => {
      const product = this.product();
      if (!product) return;
      const merged = this.cart.addProduct(product);
      this.toast.success(merged ? 'cart_quantity_updated' : 'product_added_to_cart');
    },
    { minDurationMs: 500 }
  );
}
