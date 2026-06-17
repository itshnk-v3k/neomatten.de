/*
 * EN: Read-only configuration summary shared by the configurator Summary step
 *     (live signals) and the cart line items (serialized CartItem). Renders every
 *     configuration step as a labelled row with the selected value (or "—" when
 *     skipped), so both surfaces stay byte-for-byte consistent. Purely
 *     presentational — the parent resolves colour names/hex + prices into the VM.
 * RU: Только для чтения — сводка конфигурации, общая для шага «Итог» конфигуратора
 *     (живые сигналы) и позиций корзины (сериализованный CartItem). Показывает
 *     каждый шаг строкой «метка — значение» (или «—», если пропущено), чтобы обе
 *     поверхности были идентичны. Чисто презентационный компонент — родитель
 *     подставляет названия/hex цветов и цены в VM.
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideCar, LucideLayers, LucidePackage, LucideSettings } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/** Resolved configuration view-model rendered by {@link ConfigDetailsComponent}. */
export interface ConfigDetailsVM {
  /** Vehicle line, e.g. "Acura MDX 2014–2020" (null → "—"). */
  readonly vehicle: string | null;
  // Step-02 refine spec (raw codes; null → "—").
  readonly transmission: string | null;
  readonly year: number | null;
  readonly drive: string | null;
  readonly engine: string | null;
  // Mat configuration (raw codes; colours pre-resolved to a localized name + hex).
  readonly material: string | null;
  readonly texture: string | null;
  readonly materialColour: string | null;
  readonly materialColourHex: string | null;
  readonly edgeColour: string | null;
  readonly edgeColourHex: string | null;
  readonly mounting: string | null;
  readonly heelPad: string | null;
  readonly heelPadPrice: number;
  readonly heelRest: string | null;
  readonly heelRestPrice: number;
  readonly accessories: string | null;
  /** Selected mat positions as CarZone codes (empty → "—"). */
  readonly positions: readonly string[];
  /** Delivery-tier i18n key (null → "—") + cost (null/0 → free). */
  readonly deliveryTierKey: string | null;
  readonly deliveryCost: number | null;
}

@Component({
  selector: 'nm-config-details',
  imports: [TranslatePipe, LucideCar, LucideLayers, LucideSettings, LucidePackage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './config-details.component.html',
})
export class ConfigDetailsComponent {
  readonly details = input.required<ConfigDetailsVM>();

  /** Accessories value ('with_clips'/'without_clips') → its i18n key. */
  protected accessoriesKey(value: string): string {
    return value === 'with_clips' ? 'configurator_clips_with' : 'configurator_clips_without';
  }

  /** Engine value → i18n key ('petrol-gas' → 'refine_engine_petrol_gas'). */
  protected engineKey(value: string): string {
    return `refine_engine_${value.replace('-', '_')}`;
  }
}
