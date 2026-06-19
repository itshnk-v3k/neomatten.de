/*
 * EN: The configurator's per-step explanation dialogs (material, texture, build
 *     your set, accessories, heel pad), grouped out of the page template. Each
 *     open state is a two-way model bound from the parent (the ℹ️ step buttons
 *     toggle them). Purely presentational — content comes from the translate keys.
 * RU: Поясняющие диалоги шагов конфигуратора (материал, фактура, набор, аксессуары,
 *     подпятник), вынесенные из шаблона страницы. Состояние открытия — two-way
 *     model из родителя (кнопки ℹ️ у шагов). Чисто презентационный компонент.
 */
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-configurator-info-dialogs',
  imports: [DialogComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './configurator-info-dialogs.component.html',
})
export class ConfiguratorInfoDialogsComponent {
  readonly materialInfoOpen = model<boolean>(false);
  readonly textureInfoOpen = model<boolean>(false);
  readonly mountingInfoOpen = model<boolean>(false);
  readonly kitInfoOpen = model<boolean>(false);
  readonly accessoriesInfoOpen = model<boolean>(false);
  readonly heelInfoOpen = model<boolean>(false);
  readonly heelRestInfoOpen = model<boolean>(false);
  readonly deliveryInfoOpen = model<boolean>(false);
}
