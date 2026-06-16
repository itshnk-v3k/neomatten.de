/*
 * EN: Configurator step 1 — brand selection. A grid of circular brand cards (one
 *     per brand in the dataset). Each card links to /configurator/:brand; the
 *     logo is the real brand image from assets/brands/ when present, otherwise
 *     the BrandLogoComponent initials fallback. No form, no dropdowns.
 * RU: Шаг 1 конфигуратора — выбор марки. Сетка круглых карточек марок (по одной
 *     на марку из набора). Каждая ведёт на /configurator/:brand; логотип — реальное
 *     изображение из assets/brands/, иначе фолбэк с инициалами BrandLogoComponent.
 *     Без формы и выпадающих списков.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { VehicleService } from '@core/services/vehicle.service';
import { BrandCardComponent } from '@shared/components/brand-card/brand-card.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-brand-select-page',
  imports: [BrandCardComponent, BreadcrumbComponent, SkeletonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-select-page.component.html',
  styleUrl: './brand-select-page.component.scss',
})
export class BrandSelectPageComponent {
  private readonly vehicles = inject(VehicleService);

  protected readonly brands = this.vehicles.brands;
  protected readonly loaded = this.vehicles.loaded;
  protected readonly loading = this.vehicles.loading;
}
