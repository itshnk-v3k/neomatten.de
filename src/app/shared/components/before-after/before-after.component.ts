/*
 * EN: Before/after image comparison slider for the shared UI kit. A draggable
 *     divider reveals the "after" image over the "before" image. Pointer events
 *     (mouse + touch via pointer capture) and keyboard arrows move the divider;
 *     exposed as a slider role for accessibility. Ports the legacy before-after.js.
 * RU: Слайдер сравнения «до/после» для общего UI-кита. Перетаскиваемый разделитель
 *     показывает изображение «после» поверх «до». Указатель (мышь + тач через
 *     pointer capture) и стрелки клавиатуры двигают разделитель; роль slider для
 *     доступности. Портирует устаревший before-after.js.
 */
import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { LucideMoveHorizontal } from '@lucide/angular';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-before-after',
  imports: [NgOptimizedImage, LucideMoveHorizontal, ImagePlaceholderComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './before-after.component.html',
  styleUrl: './before-after.component.scss',
})
export class BeforeAfterComponent {
  /** Image sources (null → render the local nm-image-placeholder). */
  readonly beforeSrc = input<string | null>(null);
  readonly afterSrc = input<string | null>(null);

  /** Alt text + label translation keys. */
  readonly beforeAlt = input<string>('home_comparison_before_alt');
  readonly afterAlt = input<string>('home_comparison_after_alt');
  readonly beforeLabelKey = input<string>('home_comparison_before');
  readonly afterLabelKey = input<string>('home_comparison_after');
  readonly handleLabelKey = input<string>('home_comparison_handle_label');

  /** Divider position as a percentage from the left edge (0–100). */
  protected readonly position = signal(50);

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');

  /** Keyboard step in percent for the slider role. */
  private static readonly STEP = 2;

  protected onPointerDown(event: PointerEvent): void {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    // Only react while a button/touch is held (pointer capture keeps events flowing).
    if (event.buttons === 0) {
      return;
    }
    this.setFromClientX(event.clientX);
  }

  /** Click anywhere on the image jumps the divider to that point (legacy behavior). */
  protected onContainerPointerDown(event: PointerEvent): void {
    this.setFromClientX(event.clientX);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.position.update(value => Math.max(0, value - BeforeAfterComponent.STEP));
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.position.update(value => Math.min(100, value + BeforeAfterComponent.STEP));
      event.preventDefault();
    } else if (event.key === 'Home') {
      this.position.set(0);
      event.preventDefault();
    } else if (event.key === 'End') {
      this.position.set(100);
      event.preventDefault();
    }
  }

  private setFromClientX(clientX: number): void {
    const rect = this.container().nativeElement.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    this.position.set(Math.max(0, Math.min(100, Math.round(percent))));
  }
}
