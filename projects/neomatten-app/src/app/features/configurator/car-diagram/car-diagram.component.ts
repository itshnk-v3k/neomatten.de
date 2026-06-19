/*
 * EN: Car-diagram selector. A top-view car blueprint photo (ngSrc) with five
 *     absolutely-positioned circular hotspot buttons — front-left, front-right,
 *     rear-left, rear-right and trunk. Selected hotspots fill in the brand
 *     primary; unselected are outlined only. Emits `zoneToggle` when a hotspot is
 *     clicked/activated; the parent owns the selected-zone set so it stays in
 *     sync with the step-07 kit builder. Admin can swap the blueprint for real
 *     car photos later — only the image source changes.
 * RU: Селектор-схема авто. Фото-чертёж авто сверху (ngSrc) с пятью абсолютно
 *     позиционированными круглыми хотспот-кнопками — перед-лево, перед-право,
 *     зад-лево, зад-право и багажник. Выбранные хотспоты заливаются основным
 *     цветом бренда, невыбранные — только контур. Эмитит `zoneToggle` по
 *     клику/активации; родитель владеет набором выбранных зон, поэтому он
 *     синхронен с конструктором набора (шаг 07). Позже админ заменит чертёж на
 *     реальные фото — меняется только источник изображения.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslationService } from '@core/i18n/translation.service';

import { type CarZone } from '../configurator.service';

interface Hotspot {
  readonly zone: CarZone;
  /** Position within the relative container, in percent. */
  readonly left: number;
  readonly top: number;
  readonly labelKey: string;
}

@Component({
  selector: 'nm-car-diagram',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './car-diagram.component.html',
})
export class CarDiagramComponent {
  private readonly translation = inject(TranslationService);

  /** Currently selected zones (owned by the parent). */
  readonly zones = input.required<ReadonlySet<CarZone>>();
  /** Emitted when a zone is clicked/activated. */
  readonly zoneToggle = output<CarZone>();

  /** Top-view car blueprint behind the hotspots. */
  protected readonly carImage = 'assets/configurator/car-top-view.svg';

  // Positions are percentages of the rendered image box, derived from the new
  // top-view SVG (viewBox 550×1180, nose at top, cabin centred on x≈50%): side
  // mirrors sit at y≈22%, so the front seats fall just behind at y≈38%, the rear
  // bench at y≈57% and the trunk near the tail at y≈83%.
  protected readonly hotspots: readonly Hotspot[] = [
    { zone: 'front_left', left: 34, top: 38, labelKey: 'kit_piece_front_left' },
    { zone: 'front_right', left: 66, top: 38, labelKey: 'kit_piece_front_right' },
    { zone: 'rear_left', left: 34, top: 57, labelKey: 'kit_piece_rear_left' },
    { zone: 'rear_right', left: 66, top: 57, labelKey: 'kit_piece_rear_right' },
    { zone: 'trunk', left: 50, top: 83, labelKey: 'kit_piece_trunk' },
  ];

  /**
   * Short visual dot labels, localized: German uses VL/VR/HL/HR/K
   * (Vorne/Hinten Links/Rechts, Kofferraum); English keeps FL/FR/RL/RR/T.
   */
  protected readonly zoneLabels = computed<Record<CarZone, string>>(() => {
    const de = this.translation.currentLanguage() === 'de';
    return {
      front_left: de ? 'VL' : 'FL',
      front_right: de ? 'VR' : 'FR',
      rear_left: de ? 'HL' : 'RL',
      rear_right: de ? 'HR' : 'RR',
      trunk: de ? 'K' : 'T',
    };
  });

  protected isSelected(zone: CarZone): boolean {
    return this.zones().has(zone);
  }

  protected label(key: string): string {
    return this.translation.translate(key);
  }

  protected onActivate(zone: CarZone): void {
    this.zoneToggle.emit(zone);
  }
}
