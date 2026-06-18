/*
 * EN: Modal dialog for the shared UI kit. Renders a centered panel over a dimmed
 *     backdrop when open(), projects body and optional [dialogFooter] content,
 *     and (when dismissible) closes on the X button, backdrop click or Escape.
 * RU: Модальное окно общего UI-кита. При open() показывает центрированную панель
 *     поверх затемнённого фона, проецирует тело и необязательный [dialogFooter],
 *     и (если dismissible) закрывается по X, клику по фону или Escape.
 */
import type { OnDestroy } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  model,
} from '@angular/core';
import { LucideX } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ScrollLockService } from '@shared/services/scroll-lock.service';

let uid = 0;

@Component({
  selector: 'nm-dialog',
  imports: [TranslatePipe, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent implements OnDestroy {
  private readonly scrollLock = inject(ScrollLockService);

  /** Two-way open state; the panel renders only while true. */
  readonly open = model<boolean>(false);
  /** Optional header title as a translation key. */
  readonly titleKey = input<string>('');
  /** When false the dialog cannot be dismissed by user interaction. */
  readonly dismissible = input<boolean>(true);
  /** Desktop panel width (mobile is always full-screen). 'md' is the default. */
  readonly size = input<'md' | 'lg' | 'xl'>('md');

  /** Desktop max-width class for the panel, driven by `size`. */
  protected readonly panelMaxWidth = computed(() => {
    switch (this.size()) {
      case 'xl':
        return 'md:max-w-4xl';
      case 'lg':
        return 'md:max-w-2xl';
      default:
        return 'md:max-w-lg';
    }
  });

  /** Unique id for the title, linked via aria-labelledby when titleKey is set. */
  protected readonly titleId = `nm-dialog-title-${uid++}`;

  /** Tracks whether this instance currently holds a scroll lock (balanced lock/unlock). */
  private locked = false;

  constructor() {
    // Lock body scroll while open; release on close or destroy (counter-based,
    // so nested dialogs only restore scroll when the last one closes).
    effect(() => {
      const open = this.open();
      if (open && !this.locked) {
        this.scrollLock.lock();
        this.locked = true;
      } else if (!open && this.locked) {
        this.scrollLock.unlock();
        this.locked = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.locked) {
      this.scrollLock.unlock();
      this.locked = false;
    }
  }

  /** Closes the dialog when dismissible is allowed. */
  protected close(): void {
    if (this.dismissible()) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }
}
