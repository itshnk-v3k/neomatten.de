/*
 * EN: Text input for the shared UI kit. Implements ControlValueAccessor so it
 *     works with Reactive Forms (formControlName), renders an optional label and
 *     a localized validation error, and styles itself on the brand palette.
 * RU: Текстовый ввод общего UI-кита. Реализует ControlValueAccessor для работы с
 *     Reactive Forms (formControlName), отображает необязательную метку и
 *     локализованную ошибку валидации, оформлен в фирменной палитре.
 */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ValidationErrorMessagesService } from '@shared/services/validation-error-messages.service';

let uniqueId = 0;

@Component({
  selector: 'nm-input',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor, OnInit {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly errorMessages = inject(ValidationErrorMessagesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Label and placeholder are translation keys (kept behind the i18n layer). */
  readonly label = input<string>('');
  /** Accessible name (translation key) for placeholder-only inputs with no visible label. */
  readonly ariaLabel = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly type = input<string>('text');
  readonly autocomplete = input<string>('off');
  /** When true, renders a red asterisk after the label. */
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(`nm-input-${uniqueId++}`);

  protected readonly value = signal<string>('');
  protected readonly disabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    // OnPush: re-render the inline error when the control's touched/validity
    // state changes — e.g. markAllAsTouched() on submit, which otherwise
    // wouldn't trigger change detection in this child, so required-field errors
    // only appeared after the user touched each field individually.
    this.ngControl?.control?.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  /** Localized error message for the bound control, shown once touched. */
  protected get errorMessage(): string | null {
    const control = this.ngControl?.control;
    if (!control || control.valid || !(control.touched || control.dirty)) {
      return null;
    }
    return this.errorMessages.firstMessage(control.errors);
  }

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.onChange(next);
  }

  protected markTouched(): void {
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
