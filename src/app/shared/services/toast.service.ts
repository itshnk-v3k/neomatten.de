/*
 * EN: Thin wrapper around ngx-sonner for app-wide toast notifications. Accepts
 *     translation keys by default (so all copy stays keyed) with an option to
 *     pass already-resolved text. Rendered by the shared ToasterComponent.
 * RU: Тонкая обёртка над ngx-sonner для тост-уведомлений всего приложения. По
 *     умолчанию принимает ключи перевода (чтобы весь текст оставался за ключами)
 *     с опцией передать готовый текст. Отображается общим ToasterComponent.
 */
import { inject, Injectable } from '@angular/core';
import { TranslationService } from '@core/i18n/translation.service';
import { toast } from 'ngx-sonner';

export interface ToastOptions {
  /** Treat the message (and description) as raw text instead of translation keys. */
  raw?: boolean;
  /** Optional secondary line (translation key, or raw text when `raw` is true). */
  description?: string;
  /** Auto-dismiss duration in milliseconds. */
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly translation = inject(TranslationService);

  success(message: string, options?: ToastOptions): void {
    toast.success(this.resolve(message, options), this.toSonner(options));
  }

  error(message: string, options?: ToastOptions): void {
    toast.error(this.resolve(message, options), this.toSonner(options));
  }

  info(message: string, options?: ToastOptions): void {
    toast.info(this.resolve(message, options), this.toSonner(options));
  }

  warning(message: string, options?: ToastOptions): void {
    toast.warning(this.resolve(message, options), this.toSonner(options));
  }

  message(message: string, options?: ToastOptions): void {
    toast(this.resolve(message, options), this.toSonner(options));
  }

  private resolve(value: string, options?: ToastOptions): string {
    return options?.raw ? value : this.translation.translate(value);
  }

  private toSonner(options?: ToastOptions): Record<string, unknown> | undefined {
    if (!options) {
      return undefined;
    }
    return {
      duration: options.duration,
      description: options.description ? this.resolve(options.description, options) : undefined,
    };
  }
}
