/*
 * EN: Shared "copy to clipboard" helper used by every copy button (order ID, line
 *     SKUs, …). Writes the text, toasts a localized success key, and tracks which
 *     values are currently flashing a checkmark — keyed by the copied text so each
 *     button (there can be many on one page) flips back independently after ~2s.
 * RU: Общий помощник «копировать в буфер» для всех кнопок копирования (номер
 *     заказа, артикулы, …). Пишет текст, показывает локализованный тост и хранит,
 *     какие значения сейчас показывают галочку — по тексту, чтобы каждая кнопка
 *     (их может быть много) независимо возвращалась через ~2 с.
 */
import { inject, Injectable, signal } from '@angular/core';
import { ToastService } from '@shared/services/toast.service';
import { copyToClipboard } from '@shared/utils/clipboard.util';

/** How long a copy button shows the checkmark before reverting (ms). */
const COPIED_FLASH_MS = 2000;

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly toast = inject(ToastService);

  /** Texts currently flashing the "copied" checkmark, keyed by value. */
  private readonly copiedTexts = signal(new Set<string>());

  /** Whether `text`'s copy button should currently render the checkmark. */
  isCopied(text: string): boolean {
    return this.copiedTexts().has(text);
  }

  /**
   * Copy `text` to the clipboard, toast `successKey`, then flash a checkmark for
   * {@link COPIED_FLASH_MS}. Uses the fallback-aware {@link copyToClipboard} so it
   * works over HTTP / a LAN IP on mobile too. On failure shows a generic error toast.
   */
  copy(text: string, successKey: string): void {
    void copyToClipboard(text).then(ok => {
      if (!ok) {
        this.toast.error('error_generic');
        return;
      }
      this.copiedTexts.update(set => new Set(set).add(text));
      this.toast.success(successKey);
      setTimeout(() => {
        this.copiedTexts.update(set => {
          const next = new Set(set);
          next.delete(text);
          return next;
        });
      }, COPIED_FLASH_MS);
    });
  }
}
