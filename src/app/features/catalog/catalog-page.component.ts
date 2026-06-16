/*
 * EN: Catalogue browse page. The catalogue IS the brand grid — the same
 *     circular brand cards as the configurator brand-selection step. A live
 *     search filters the brand grid (not individual patterns); clicking a brand
 *     goes to /configurator/:brand where its patterns are configured. Individual
 *     patterns are only visible inside the configurator flow.
 * RU: Страница каталога. Каталог — это сетка марок (те же круглые карточки, что
 *     и на шаге выбора марки в конфигураторе). Живой поиск фильтрует сетку марок
 *     (не отдельные лекала); клик по марке ведёт на /configurator/:brand, где
 *     настраиваются её лекала. Отдельные лекала видны только в конфигураторе.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { VehicleService } from '@core/services/vehicle.service';
import { BrandCardComponent } from '@shared/components/brand-card/brand-card.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { InputComponent } from '@shared/components/input/input.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-catalog-page',
  imports: [
    ReactiveFormsModule,
    BrandCardComponent,
    BreadcrumbComponent,
    InputComponent,
    SkeletonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly vehicles = inject(VehicleService);

  protected readonly loaded = this.vehicles.loaded;
  protected readonly loading = this.vehicles.loading;

  protected readonly filters = this.fb.nonNullable.group({
    search: [''],
  });

  private readonly values = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  /** Brands matching the live search term (matches brand name). */
  protected readonly filteredBrands = computed(() => {
    const term = (this.values().search ?? '').trim().toLowerCase();
    const brands = this.vehicles.brands();
    if (!term) return brands;
    return brands.filter(b => b.name.toLowerCase().includes(term));
  });
}
