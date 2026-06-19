/*
 * EN: Custom select for the shared UI kit — a button trigger + a positioned
 *     listbox panel (NOT a native <select>), so the options match the brand
 *     design and are fully keyboard-navigable (Arrow/Home/End/Enter/Esc, type-
 *     ahead) with combobox/listbox ARIA. Implements ControlValueAccessor so it
 *     works with Reactive Forms (formControlName); renders an optional label and
 *     a localized validation error.
 * RU: Кастомный select общего UI-кита — кнопка-триггер + позиционируемая панель
 *     listbox (НЕ нативный <select>), чтобы опции соответствовали дизайну и были
 *     полностью управляемы с клавиатуры (стрелки/Home/End/Enter/Esc, поиск по
 *     первым буквам) с ARIA combobox/listbox. Реализует ControlValueAccessor для
 *     Reactive Forms (formControlName); метка и локализованная ошибка валидации.
 */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import { LucideChevronDown } from '@lucide/angular';
import type { SelectOption } from '@shared/models/select-option.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ValidationErrorMessagesService } from '@shared/services/validation-error-messages.service';

let uniqueId = 0;

@Component({
  selector: 'nm-select',
  imports: [TranslatePipe, LucideChevronDown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent implements ControlValueAccessor, OnInit {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly errorMessages = inject(ValidationErrorMessagesService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Label, placeholder and hint are translation keys (kept behind the i18n layer). */
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly options = input<SelectOption[]>([]);
  /** When true, renders a red asterisk after the label. */
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(`nm-select-${uniqueId++}`);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly value = signal<string>('');
  protected readonly disabled = signal<boolean>(false);
  protected readonly open = signal<boolean>(false);
  /** Index of the keyboard-highlighted option (aria-activedescendant). */
  protected readonly activeIndex = signal<number>(-1);

  /** The currently selected option (for the trigger label). */
  protected readonly selectedOption = computed(
    () => this.options().find(o => o.value === this.value()) ?? null
  );

  protected readonly listboxId = computed(() => `${this.inputId()}-listbox`);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  /** Buffer + timer handle for first-letter type-ahead. */
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    // OnPush: re-render the inline error when the control's touched/validity
    // state changes (e.g. markAllAsTouched() on submit).
    this.ngControl?.control?.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  protected optionId(index: number): string {
    return `${this.inputId()}-opt-${index}`;
  }

  /** Localized error message for the bound control, shown once touched. */
  protected get errorMessage(): string | null {
    const control = this.ngControl?.control;
    if (!control || control.valid || !(control.touched || control.dirty)) {
      return null;
    }
    return this.errorMessages.firstMessage(control.errors);
  }

  // --- open / close ---------------------------------------------------------

  protected toggle(): void {
    this.open() ? this.close() : this.openPanel();
  }

  private openPanel(): void {
    if (this.disabled()) {
      return;
    }
    this.open.set(true);
    const selected = this.options().findIndex(o => o.value === this.value());
    this.activeIndex.set(selected >= 0 ? selected : this.firstEnabled());
  }

  protected close(focusTrigger = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.activeIndex.set(-1);
    this.onTouched();
    if (focusTrigger) {
      this.trigger()?.nativeElement.focus();
    }
  }

  protected selectOption(option: SelectOption): void {
    if (option.disabled) {
      return;
    }
    this.value.set(option.value);
    this.onChange(option.value);
    this.close(true);
  }

  protected selectActive(): void {
    const option = this.options()[this.activeIndex()];
    if (option) {
      this.selectOption(option);
    }
  }

  /** Closes the panel when a click lands outside the component. */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  // --- keyboard -------------------------------------------------------------

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open() ? this.move(1) : this.openPanel();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.open() ? this.move(-1) : this.openPanel();
        break;
      case 'Home':
        if (this.open()) {
          event.preventDefault();
          this.activeIndex.set(this.firstEnabled());
        }
        break;
      case 'End':
        if (this.open()) {
          event.preventDefault();
          this.activeIndex.set(this.lastEnabled());
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.open() ? this.selectActive() : this.openPanel();
        break;
      case 'Escape':
        if (this.open()) {
          event.preventDefault();
          this.close(true);
        }
        break;
      case 'Tab':
        this.close();
        break;
      default:
        if (event.key.length === 1) {
          this.onTypeahead(event.key);
        }
    }
  }

  private move(delta: number): void {
    const options = this.options();
    const n = options.length;
    if (n === 0) {
      return;
    }
    // Build the wrap-around sequence of stepped indices, then take the first enabled.
    let index = this.activeIndex();
    const sequence = Array.from({ length: n }, () => {
      index = (((index + delta) % n) + n) % n;
      return index;
    });
    const next = sequence.find(i => !options[i].disabled);
    if (next !== undefined) {
      this.activeIndex.set(next);
    }
  }

  private firstEnabled(): number {
    return Math.max(
      0,
      this.options().findIndex(o => !o.disabled)
    );
  }

  private lastEnabled(): number {
    const enabled = this.options()
      .map((option, index) => (option.disabled ? -1 : index))
      .filter(index => index >= 0);
    return enabled.length > 0 ? enabled[enabled.length - 1] : 0;
  }

  private onTypeahead(char: string): void {
    if (!this.open()) {
      this.openPanel();
    }
    this.typeahead += char.toLowerCase();
    if (this.typeaheadTimer) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadTimer = setTimeout(() => (this.typeahead = ''), 500);
    const match = this.options().findIndex(
      o => !o.disabled && o.label.toLowerCase().startsWith(this.typeahead)
    );
    if (match >= 0) {
      this.activeIndex.set(match);
    }
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
