/*
 * EN: International phone input for the shared UI kit. Implements
 *     ControlValueAccessor so it plugs into Reactive Forms via formControlName. A
 *     country selector (flag + dial code, default DE) sits inside the field; the
 *     national number is auto-formatted as the user types (libphonenumber-js
 *     AsYouType). The country list is the complete libphonenumber-js set, opened
 *     in a CDK overlay (above all content, never clipped) with a search box and
 *     the target-market countries pinned on top. The model value is the E.164
 *     string when parseable. Validation is NOT done here (a self-provided
 *     NG_VALIDATORS would create a circular DI cycle) — forms attach
 *     phoneValidator() from shared/validators/phone.validator.
 * RU: Международный ввод телефона общего UI-кита. Реализует ControlValueAccessor для
 *     работы с Reactive Forms через formControlName. Внутри поля — селектор страны
 *     (флаг + код, по умолчанию DE); номер автоформатируется при вводе (AsYouType).
 *     Список стран — полный набор libphonenumber-js, открывается в CDK overlay
 *     (поверх всего, без обрезки), с поиском и закреплёнными сверху целевыми
 *     странами. Значение модели — строка E.164 (если разобрана). Валидация здесь НЕ
 *     делается (самопредоставленный NG_VALIDATORS создаёт цикл) — формы навешивают
 *     phoneValidator() из shared/validators/phone.validator.
 */
import type { ElementRef, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import { ALL_COUNTRIES, type Country, findCountry } from '@core/data/countries.data';
import { LucideChevronDown } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ValidationErrorMessagesService } from '@shared/services/validation-error-messages.service';
import {
  AsYouType,
  type CountryCode,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

import { PhoneDropdownService } from './phone-dropdown.service';

let uniqueId = 0;

/** Kept for backwards compatibility with existing `[defaultCountry]` bindings. */
export type PhoneCountry = CountryCode;

@Component({
  selector: 'nm-phone-input',
  imports: [TranslatePipe, LucideChevronDown],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
})
export class PhoneInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly errorMessages = inject(ValidationErrorMessagesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dropdown = inject(PhoneDropdownService);
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Label, placeholder and hint are translation keys (kept behind the i18n layer). */
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly defaultCountry = input<CountryCode>('DE');
  /** When true, renders a red asterisk after the label. */
  readonly required = input<boolean>(false);
  readonly inputId = input<string>(`nm-phone-input-${uniqueId++}`);

  /** The dropdown panel template + the trigger it anchors to (for the CDK overlay). */
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly menu = viewChild.required<TemplateRef<unknown>>('menu');

  protected readonly country = signal<CountryCode>('DE');
  /** Formatted national number shown in the field. */
  protected readonly display = signal<string>('');
  protected readonly dropdownOpen = signal<boolean>(false);
  protected readonly disabled = signal<boolean>(false);

  /** Country-search query for the dropdown filter. */
  protected readonly searchQuery = signal<string>('');
  protected readonly filteredCountries = computed<readonly Country[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return ALL_COUNTRIES;
    }
    return ALL_COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.phoneCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  });

  /** Currently selected country (flag + dial code for the trigger). */
  protected readonly selectedCountry = computed<Country>(
    () => findCountry(this.country()) ?? ALL_COUNTRIES[0]
  );

  /**
   * Placeholder for the active country — an international-format example number
   * (e.g. DE → "+49 30 1234567"). Used when no explicit `placeholder` is set, so
   * the hint always reflects the selected country's format.
   */
  protected readonly countryPlaceholder = computed(() => getPlaceholder(this.country()));

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.country.set(this.defaultCountry());
    // OnPush: re-render the inline error when the control's touched/validity
    // state changes (e.g. markAllAsTouched() on submit).
    this.ngControl?.control?.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy(): void {
    this.dropdown.close();
  }

  /** Localized error message for the bound control, shown once touched/dirty. */
  protected get errorMessage(): string | null {
    const control = this.ngControl?.control;
    if (!control || control.valid || !(control.touched || control.dirty)) {
      return null;
    }
    return this.errorMessages.firstMessage(control.errors);
  }

  /**
   * Handles both typing and pasting: the browser fires an `input` event after a
   * native paste, so the pasted text flows through the same normalization
   * pipeline (international-prefix detection, dial-code stripping, AsYouType
   * formatting). We deliberately do NOT intercept `paste`/`preventDefault` —
   * blocking paste is a UX anti-pattern (flagged by Lighthouse), and it is
   * unnecessary because processInput reformats the resulting field value.
   */
  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.processInput(input, input.value);
  }

  /**
   * Normalizes raw input: auto-detects the country from an international prefix
   * (+49 / 0049), strips a leading dial code the user typed or pasted, enforces
   * the country's max national length, then formats with AsYouType.
   */
  private processInput(input: HTMLInputElement, raw: string): void {
    const trimmed = raw.trim();
    // Treat a 00-international prefix the same as a leading '+'.
    const normalized = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;

    // Auto-detect & switch country when an international prefix is present.
    if (normalized.startsWith('+')) {
      const detected = parsePhoneNumberFromString(normalized)?.country;
      if (detected && detected !== this.country()) {
        this.country.set(detected);
      }
    }

    const country = this.country();
    const dial = getCountryCallingCode(country);
    const maxLength = nationalMaxLength(country);
    let digits = normalized.replace(/\D/g, '');

    // Strip a leading dial code: always when an international prefix was typed,
    // or when a bare dial code clearly precedes a full national number.
    if (digits.startsWith(dial)) {
      const overLength = maxLength !== null && digits.length > maxLength;
      if (normalized.startsWith('+') || overLength) {
        digits = digits.slice(dial.length);
      }
    }

    // Enforce the country's maximum national-number length (blocks extra digits).
    if (maxLength !== null && digits.length > maxLength) {
      digits = digits.slice(0, maxLength);
    }

    const formatted = new AsYouType(country).input(digits);
    this.display.set(formatted);
    // We may have detected/stripped/truncated — keep the DOM field in sync.
    input.value = formatted;
    this.emitValue();
  }

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected selectCountry(code: CountryCode): void {
    this.country.set(code);
    this.closeDropdown();
    // Re-format the existing number against the new country and re-emit.
    this.display.set(new AsYouType(code).input(this.display()));
    this.emitValue();
  }

  protected toggleDropdown(): void {
    if (this.disabled()) {
      return;
    }
    this.dropdownOpen() ? this.closeDropdown() : this.openDropdown();
  }

  private openDropdown(): void {
    this.searchQuery.set('');
    const overlayRef = this.dropdown.open(this.trigger(), this.menu(), this.viewContainerRef);
    overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeDropdown());
    // detachments() fires on scroll-close too — keep the open state in sync.
    overlayRef
      .detachments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.dropdownOpen()) {
          this.dropdownOpen.set(false);
          this.cdr.markForCheck();
        }
      });
    overlayRef
      .keydownEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event.key === 'Escape') {
          this.closeDropdown();
        }
      });
    this.dropdownOpen.set(true);
  }

  protected closeDropdown(): void {
    this.dropdown.close();
    this.dropdownOpen.set(false);
  }

  protected markTouched(): void {
    this.onTouched();
  }

  /** Emits the E.164 number when parseable, else the raw national text. */
  private emitValue(): void {
    const national = this.display().trim();
    if (!national) {
      this.onChange('');
      return;
    }
    const parsed = parsePhoneNumberFromString(national, this.country());
    this.onChange(parsed ? parsed.number : national);
  }

  // --- ControlValueAccessor ---
  writeValue(value: string): void {
    const incoming = (value ?? '').toString().trim();
    if (!incoming) {
      this.display.set('');
      return;
    }
    const parsed = parsePhoneNumberFromString(incoming);
    if (parsed?.country) {
      this.country.set(parsed.country);
      this.display.set(new AsYouType(parsed.country).input(parsed.nationalNumber.toString()));
    } else {
      this.display.set(new AsYouType(this.country()).input(incoming));
    }
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

/** International-format example number for a country (used as the placeholder). */
function getPlaceholder(country: CountryCode): string {
  try {
    const example = getExampleNumber(country, examples);
    return example ? example.formatInternational() : '';
  } catch {
    return '';
  }
}

/** Example national-number length for a country — the digit-limit ceiling. */
function nationalMaxLength(country: CountryCode): number | null {
  try {
    const example = getExampleNumber(country, examples);
    return example ? example.nationalNumber.length : null;
  } catch {
    return null;
  }
}
