/*
 * EN: Reusable Reactive Forms validators shared across the site (cross-field
 *     match, non-empty trimmed text). Phone-number validation lives in its own
 *     module: see [phone.validator.ts](./phone.validator.ts).
 * RU: Переиспользуемые валидаторы Reactive Forms (совпадение полей, непустой текст
 *     после trim). Валидация телефона — в отдельном модуле phone.validator.ts.
 */
import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

/**
 * Requires two controls (by name) to hold the same value. Attach to the parent
 * FormGroup; the error is reported on the group as `{ mismatch: true }`.
 */
export function matchFieldsValidator(
  controlName: string,
  matchingControlName: string
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const control = group.get(controlName);
    const matching = group.get(matchingControlName);
    if (!control || !matching) {
      return null;
    }
    return control.value === matching.value ? null : { mismatch: true };
  };
}

/** Rejects values that are empty once trimmed (e.g. whitespace-only input). */
export function trimmedRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString();
    return value.trim().length > 0 ? null : { required: true };
  };
}
