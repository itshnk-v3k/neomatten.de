/*
 * EN: Configurator preview (presentational). Three modes:
 *     • `full` — desktop left column: mat preview (steps ≤10) cross-fading to the
 *       car diagram from step 11 (Build your set), plus the desktop total.
 *     • `mat` — compact mat preview only (inline mobile slot, after Refine).
 *     • `car` — compact car diagram only (inline mobile slot, before Build your set).
 *     All state is passed in as inputs; the only output is the kit zone toggle.
 * RU: Превью конфигуратора (презентационное). Три режима:
 *     • `full` — левая колонка десктопа: превью коврика (шаги ≤10) с переходом на
 *       схему авто с шага 11 (сборка набора) + итог (десктоп).
 *     • `mat` — только компактное превью коврика (встроенный слот на мобиле).
 *     • `car` — только компактная схема авто (встроенный слот на мобиле).
 *     Всё состояние приходит входами; единственный выход — переключение зоны.
 */
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CarDiagramComponent } from '@features/configurator/car-diagram/car-diagram.component';
import type {
  CarZone,
  HeelPadAccessory,
  HeelRest,
  Mounting,
  Texture,
} from '@features/configurator/configurator.service';
import { MatPreviewComponent } from '@features/configurator/mat-preview/mat-preview.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-configurator-preview',
  imports: [MatPreviewComponent, CarDiagramComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './configurator-preview.component.html',
  // The host IS the left flex child, so the sticky/width/self-start layout lives
  // here (not on an inner div) — otherwise sticky has no sized flex item to anchor
  // to and the column stops scrolling with the steps.
  host: {
    class:
      'mb-6 flex flex-col gap-4 lg:sticky lg:top-20 lg:mb-0 lg:w-[420px] lg:shrink-0 lg:gap-6 lg:self-start',
  },
})
export class ConfiguratorPreviewComponent {
  /**
   * `full` (default) = desktop sticky column (mat → car cross-fade + total);
   * `mat`/`car` = a single compact panel for the inline mobile slots.
   */
  readonly mode = input<'full' | 'mat' | 'car'>('full');

  readonly texture = input.required<Texture>();
  readonly materialHex = input.required<string>();
  readonly edgeHex = input.required<string>();
  readonly mounting = input.required<Mounting>();
  readonly heelPad = input.required<HeelPadAccessory>();
  readonly heelRest = input.required<HeelRest>();
  readonly caption = input.required<string>();
  readonly sku = input<string>('');
  readonly colorId = input<string>('');
  readonly zones = input.required<ReadonlySet<CarZone>>();
  /** Active step (1–13); drives the desktop preview → diagram cross-fade at step 11. */
  readonly activeStep = input.required<number>();
  readonly total = input.required<number>();

  readonly zoneToggle = output<CarZone>();

  /** Desktop `full` mode swap: mat preview for steps ≤10, car diagram from step 11. */
  protected readonly showCarDiagram = computed(() => this.activeStep() >= 11);
  protected readonly showMatPreview = computed(() => !this.showCarDiagram());
}
