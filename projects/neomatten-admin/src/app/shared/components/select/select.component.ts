/*
 * na-select — branded combobox for the admin UI (button trigger + positioned
 * listbox panel, NOT a native <select>), so dropdowns match the admin theme
 * (#8B1A1A) instead of the browser's default control. Fully keyboard-navigable
 * (Arrow/Home/End/Enter/Esc + type-ahead) with combobox/listbox ARIA, and
 * implements ControlValueAccessor so it drops into Reactive Forms
 * (formControlName / [formControl]).
 *
 * NOTE (tech debt): this is a trimmed, dependency-free port of the public
 * site's shared `nm-select`
 * (projects/neomatten-app/src/app/shared/components/select). The two are NOT
 * shared because they couple to different i18n stacks (this one takes already-
 * localized label/placeholder strings; the app one pipes translation keys) and
 * `neomatten-shared` is a DTO-only library, not a UI-component library. A future
 * cross-project UI kit could unify them.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { type ControlValueAccessor, NgControl } from '@angular/forms';
import { LucideChevronDown } from '@lucide/angular';

/** A single option: `label` is an already-localized display string. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

let uniqueId = 0;

@Component({
  selector: 'na-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideChevronDown],
  templateUrl: './select.component.html',
  styles: [':host { display: block; }'],
})
export class SelectComponent implements ControlValueAccessor {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Already-localized options (resolve i18n at the call site). */
  readonly options = input<SelectOption[]>([]);
  /** Already-localized placeholder shown when no option is selected. */
  readonly placeholder = input<string>('');
  /** Accessible name for the trigger when there is no external <label for>. */
  readonly ariaLabel = input<string>('');
  /** Trigger id — pair with an external <label [for]> to associate a visible label. */
  readonly inputId = input<string>(`na-select-${uniqueId++}`);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly value = signal<string>('');
  protected readonly disabled = signal<boolean>(false);
  protected readonly open = signal<boolean>(false);
  /** Index of the keyboard-highlighted option (aria-activedescendant). */
  protected readonly activeIndex = signal<number>(-1);

  protected readonly selectedOption = computed(
    () => this.options().find(o => o.value === this.value()) ?? null
  );
  protected readonly listboxId = computed(() => `${this.inputId()}-listbox`);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Self-register as the value accessor (avoids the NG_VALUE_ACCESSOR
    // provider's circular dependency on the component).
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  protected optionId(index: number): string {
    return `${this.inputId()}-opt-${index}`;
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

  // --- ControlValueAccessor -------------------------------------------------

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
