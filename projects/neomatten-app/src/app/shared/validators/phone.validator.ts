/*
 * EN: Standalone phone-number validator (libphonenumber-js). Lives apart from the
 *     nm-phone-input component on purpose: a component that is a
 *     ControlValueAccessor must NOT also provide NG_VALIDATORS for itself — that
 *     creates a circular DI cycle (component → NgControl → NgValidators →
 *     component). Forms attach this validator to the phone FormControl directly.
 *     Empty is treated as valid (use Validators.required separately when needed).
 * RU: Отдельный валидатор телефона (libphonenumber-js). Намеренно вынесен из
 *     компонента nm-phone-input: компонент-ControlValueAccessor не должен сам
 *     предоставлять NG_VALIDATORS — это создаёт циклическую зависимость DI. Формы
 *     навешивают валидатор на FormControl телефона напрямую. Пустое значение —
 *     валидно (используйте Validators.required отдельно при необходимости).
 */
import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parsePhoneNumber } from 'libphonenumber-js';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString();
    if (!value.trim()) {
      return null;
    }
    try {
      const phone = parsePhoneNumber(value);
      return phone?.isValid() ? null : { invalidPhone: true };
    } catch {
      return { invalidPhone: true };
    }
  };
}
