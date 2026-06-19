/*
 * EN: Slide-in drawer (sheet) for the shared UI kit. Anchors a panel to a chosen
 *     side over a dimmed backdrop while open(), projects content, and (when
 *     dismissible) closes on the X button, backdrop click or Escape.
 * RU: Выдвижная панель (sheet) общего UI-кита. При open() прикрепляет панель к
 *     выбранной стороне поверх затемнённого фона, проецирует контент и (если
 *     dismissible) закрывается по X, клику по фону или Escape.
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

export type SheetSide = 'left' | 'right' | 'top' | 'bottom';

@Component({
  selector: 'nm-sheet',
  imports: [TranslatePipe, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sheet.component.html',
  styleUrl: './sheet.component.scss',
})
export class SheetComponent implements OnDestroy {
  private readonly scrollLock = inject(ScrollLockService);

  /** Two-way open state; the panel renders only while true. */
  readonly open = model<boolean>(false);
  /** Side the panel is anchored to. */
  readonly side = input<SheetSide>('right');
  /** Optional header title as a translation key. */
  readonly titleKey = input<string>('');
  /** When false the sheet cannot be dismissed by user interaction. */
  readonly dismissible = input<boolean>(true);

  /** Unique id for the title, linked via aria-labelledby when titleKey is set. */
  protected readonly titleId = `nm-sheet-title-${uid++}`;

  /** Outer container alignment of the panel for the chosen side. */
  protected readonly containerClasses = computed(() => {
    switch (this.side()) {
      case 'left':
        return 'justify-start';
      case 'top':
        return 'items-start';
      case 'bottom':
        return 'items-end';
      case 'right':
      default:
        return 'justify-end';
    }
  });

  /** Panel sizing + slide-in animation classes for the chosen side. */
  protected readonly panelClasses = computed(() => {
    switch (this.side()) {
      case 'left':
        return 'h-full w-80 max-w-[90vw] animate-in slide-in-from-left';
      case 'top':
        return 'w-full max-h-[90vh] animate-in slide-in-from-top';
      case 'bottom':
        return 'w-full max-h-[90vh] animate-in slide-in-from-bottom';
      case 'right':
      default:
        return 'h-full w-80 max-w-[90vw] animate-in slide-in-from-right';
    }
  });

  /** Tracks whether this instance currently holds a scroll lock. */
  private locked = false;

  constructor() {
    // Lock body scroll while open (counter-based via ScrollLockService).
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

  /** Closes the sheet when dismissible is allowed. */
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
