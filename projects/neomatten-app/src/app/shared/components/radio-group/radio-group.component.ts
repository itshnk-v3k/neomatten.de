/*
 * EN: Radio group for the shared UI kit. Implements ControlValueAccessor<string>
 *     so it works with Reactive Forms (formControlName); renders an nm-radio per
 *     option with an optional group legend and vertical/horizontal layout.
 * RU: Группа радио общего UI-кита. Реализует ControlValueAccessor<string> для
 *     работы с Reactive Forms (formControlName); отображает nm-radio на каждую
 *     опцию с необязательной легендой и вертикальной/горизонтальной раскладкой.
 */
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import { RadioComponent } from '@shared/components/radio/radio.component';
import { type SelectOption } from '@shared/models/select-option.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

let uniqueId = 0;

@Component({
  selector: 'nm-radio-group',
  imports: [RadioComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio-group.component.html',
  styleUrl: './radio-group.component.scss',
})
export class RadioGroupComponent implements ControlValueAccessor {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  /** Label is a translation key, rendered as the group legend. */
  readonly label = input<string>('');
  readonly options = input<SelectOption[]>([]);
  readonly name = input<string>(`nm-radio-group-${uniqueId++}`);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  protected readonly value = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  protected onSelect(next: string): void {
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  // --- ControlValueAccessor ---
  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
