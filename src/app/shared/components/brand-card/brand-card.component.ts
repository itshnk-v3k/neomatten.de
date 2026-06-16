/*
 * EN: Circular brand card. A single tappable brand tile linking to
 *     /configurator/:brand. The mark itself (vector / bitmap / initials) is
 *     resolved by BrandLogoComponent from the brand id. Shared by the
 *     configurator brand-selection grid and the catalogue brand grid.
 * RU: Круглая карточка марки. Одна нажимаемая плитка марки со ссылкой на
 *     /configurator/:brand. Сам знак (вектор / растр / инициалы) подбирается
 *     BrandLogoComponent по id марки. Используется сеткой выбора марки в
 *     конфигураторе и сеткой марок в каталоге.
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Brand } from '@core/models/vehicle.model';
import { BrandLogoComponent } from '@shared/components/brand-logo/brand-logo.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

@Component({
  selector: 'nm-brand-card',
  imports: [RouterLink, BrandLogoComponent, SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-card.component.html',
})
export class BrandCardComponent {
  readonly brand = input.required<Brand>();
}
