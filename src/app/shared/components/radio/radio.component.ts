/*
 * EN: Presentational single radio control for the shared UI kit (NOT a CVA).
 *     Renders a styled radio circle with a localized label and emits `selected`
 *     with its value on click; orchestrated by nm-radio-group.
 * RU: Презентационный одиночный радио-контрол общего UI-кита (НЕ CVA).
 *     Отображает оформленный кружок с локализованной меткой и эмитит `selected`
 *     со своим значением по клику; управляется через nm-radio-group.
 */
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

let uniqueId = 0;

@Component({
  selector: 'nm-radio',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
})
export class RadioComponent {
  /** Label is a translation key (kept behind the i18n layer). */
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly name = input<string>('');
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly inputId = input<string>(`nm-radio-${uniqueId++}`);

  readonly selected = output<string>();

  protected onSelect(): void {
    if (!this.disabled()) {
      this.selected.emit(this.value());
    }
  }
}
