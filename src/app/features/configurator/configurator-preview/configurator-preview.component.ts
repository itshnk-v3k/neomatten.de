/*
 * EN: Configurator left column (presentational). Shows the mat preview for steps
 *     1–10 and cross-fades to the clickable car diagram from step 11 (Build your
 *     set) onward on desktop; both stack on mobile. Renders the desktop total.
 *     All state is passed in as inputs; the only output is the kit zone toggle.
 * RU: Левая колонка конфигуратора (презентационная). Показывает превью коврика на
 *     шагах 1–10 и плавно переключается на кликабельную схему авто с шага 11
 *     (сборка набора) на десктопе; на мобиле обе видны. Показывает итог (десктоп).
 *     Всё состояние приходит входами; единственный выход — переключение зоны.
 */
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
}
