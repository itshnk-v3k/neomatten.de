/*
 * EN: Thin top promo bar that auto-rotates through four announcement messages
 *     every four seconds. The active index is held in a signal advanced by a
 *     setInterval started in ngOnInit and cleared in ngOnDestroy.
 * RU: Тонкая верхняя промо-полоса, автоматически прокручивающая четыре
 *     сообщения каждые четыре секунды. Активный индекс хранится в сигнале,
 *     обновляемом setInterval (старт в ngOnInit, очистка в ngOnDestroy).
 */
import {
  ChangeDetectionStrategy,
  Component,
  type OnDestroy,
  type OnInit,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-announce-bar',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './announce-bar.component.html',
  styleUrl: './announce-bar.component.scss',
})
export class AnnounceBarComponent implements OnInit, OnDestroy {
  /** Rotation interval in milliseconds. */
  private static readonly ROTATE_MS = 4000;

  /**
   * Translation keys for the four rotating messages.
   * TODO(admin): the message set (and rotation) should come from an admin-managed
   * config/service (e.g. `GET /api/settings/announcements`) instead of this static
   * array; the keys here are the fallback/default content.
   */
  protected readonly messages = [
    'announce_free_shipping',
    'announce_custom_made',
    'announce_rating',
    'announce_production',
  ] as const;

  protected readonly index = signal(0);

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.index.update(i => (i + 1) % this.messages.length);
    }, AnnounceBarComponent.ROTATE_MS);
  }

  ngOnDestroy(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
    }
  }
}
