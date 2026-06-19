/*
 * EN: Maps Angular ValidationErrors to translated, user-facing messages. Form
 *     controls in the UI kit use it to render a single localized error string,
 *     keeping all copy behind translation keys.
 * RU: Преобразует ValidationErrors Angular в переведённые сообщения для
 *     пользователя. Контролы UI-кита используют его, чтобы показывать одну
 *     локализованную строку ошибки, оставляя весь текст за ключами перевода.
 */
import { inject, Injectable } from '@angular/core';
import type { ValidationErrors } from '@angular/forms';
import { TranslationService } from '@core/i18n/translation.service';

@Injectable({ providedIn: 'root' })
export class ValidationErrorMessagesService {
  private readonly translation = inject(TranslationService);

  /** Order in which errors are reported when a control has several. */
  private readonly priority = [
    'required',
    'email',
    'minlength',
    'maxlength',
    'min',
    'max',
    'phone',
    'invalidPhone',
    'mismatch',
    'pattern',
  ];

  /** Returns the first (highest-priority) translated message, or null if valid. */
  firstMessage(errors: ValidationErrors | null | undefined): string | null {
    if (!errors) {
      return null;
    }
    const key = this.priority.find(name => errors[name]) ?? Object.keys(errors)[0];
    return key ? this.messageFor(key, errors[key]) : null;
  }

  private messageFor(errorKey: string, errorValue: unknown): string {
    switch (errorKey) {
      case 'required':
        return this.translation.translate('validation_required');
      case 'email':
        return this.translation.translate('validation_email');
      case 'minlength':
        return this.interpolate('validation_min_length', errorValue as { requiredLength: number });
      case 'maxlength':
        return this.interpolate('validation_max_length', errorValue as { requiredLength: number });
      case 'min':
        return this.interpolate('validation_min', errorValue as { min: number });
      case 'max':
        return this.interpolate('validation_max', errorValue as { max: number });
      case 'phone':
      case 'invalidPhone':
        return this.translation.translate('validation_phone');
      case 'mismatch':
        return this.translation.translate('validation_mismatch');
      case 'pattern':
        return this.translation.translate('validation_pattern');
      default:
        return this.translation.translate(`validation_${errorKey}`);
    }
  }

  /** Replaces `{token}` placeholders in a translated string with error params. */
  private interpolate(key: string, params: Record<string, unknown>): string {
    const template = this.translation.translate(key);
    return template.replace(/\{(\w+)\}/g, (_, token: string) =>
      params && token in params ? String(params[token]) : `{${token}}`
    );
  }
}
