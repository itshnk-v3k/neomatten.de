/*
 * EN: Configurator step 1 — brand selection. A grid of circular brand cards (one
 *     per brand in the dataset). Each card links to /configurator/:brand; the
 *     logo is the real brand image from assets/images/brands/ when present, otherwise
 *     the BrandLogoComponent initials fallback. No form, no dropdowns.
 * RU: Шаг 1 конфигуратора — выбор марки. Сетка круглых карточек марок (по одной
 *     на марку из набора). Каждая ведёт на /configurator/:brand; логотип — реальное
 *     изображение из assets/images/brands/, иначе фолбэк с инициалами BrandLogoComponent.
 *     Без формы и выпадающих списков.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { VehicleService } from '@core/services/vehicle.service';
import { LucideSearch } from '@lucide/angular';
import { BrandCardComponent } from '@shared/components/brand-card/brand-card.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { InputComponent } from '@shared/components/input/input.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-brand-select-page',
  imports: [
    ReactiveFormsModule,
    BrandCardComponent,
    BreadcrumbComponent,
    InputComponent,
    SkeletonComponent,
    TranslatePipe,
    LucideSearch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-select-page.component.html',
  styleUrl: './brand-select-page.component.scss',
})
export class BrandSelectPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly vehicles = inject(VehicleService);

  protected readonly brands = this.vehicles.brands;
  protected readonly loaded = this.vehicles.loaded;
  protected readonly loading = this.vehicles.loading;

  // Local-only search state — lives with the component, so it clears whenever the
  // user navigates away (the page is destroyed) and is never persisted.
  protected readonly filters = this.fb.nonNullable.group({
    search: [''],
  });

  private readonly values = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  /** Brands matching the live, case-insensitive search term (matches brand name). */
  protected readonly filteredBrands = computed(() => {
    const term = (this.values().search ?? '').trim().toLowerCase();
    const brands = this.brands();
    if (!term) return brands;
    return brands.filter(b => b.name.toLowerCase().includes(term));
  });
}
