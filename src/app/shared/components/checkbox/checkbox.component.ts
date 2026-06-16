/*
 * EN: Checkbox for the shared UI kit. Implements ControlValueAccessor<boolean>
 *     so it works with Reactive Forms (formControlName); renders a styled box
 *     with a lucide check and an optional localized label on the right.
 * RU: Чекбокс общего UI-кита. Реализует ControlValueAccessor<boolean> для работы
 *     с Reactive Forms (formControlName); отображает оформленный квадрат с
 *     галочкой lucide и необязательную локализованную метку справа.
 */
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import { LucideCheck } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

let uniqueId = 0;

@Component({
  selector: 'nm-checkbox',
  imports: [TranslatePipe, LucideCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent implements ControlValueAccessor {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  /** Label is a translation key (kept behind the i18n layer). */
  readonly label = input<string>('');
  readonly inputId = input<string>(`nm-checkbox-${uniqueId++}`);

  protected readonly checked = signal<boolean>(false);
  protected readonly disabled = signal<boolean>(false);

  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  protected onToggle(event: Event): void {
    const next = (event.target as HTMLInputElement).checked;
    this.checked.set(next);
    this.onChange(next);
  }

  protected markTouched(): void {
    this.onTouched();
  }

  // --- ControlValueAccessor ---
  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
