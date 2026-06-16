/*
 * EN: Tooltip directive for the shared UI kit. Shows a small styled bubble with
 *     a localized message (translation key) on hover/focus of the host element,
 *     positioned on the chosen side, and removes it on leave/blur or destroy.
 * RU: Директива тултипа общего UI-кита. По наведению/фокусу на хост показывает
 *     небольшой стилизованный пузырёк с локализованным текстом (ключ перевода) у
 *     выбранной стороны и убирает его при уходе/потере фокуса или уничтожении.
 */
import type { OnDestroy } from '@angular/core';
import { Directive, ElementRef, HostListener, inject, input, Renderer2 } from '@angular/core';
import { TranslationService } from '@core/i18n/translation.service';

let uid = 0;

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[nmTooltip]',
})
export class TooltipDirective implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly translation = inject(TranslationService);

  /** Translation key for the tooltip text. */
  readonly nmTooltip = input.required<string>();
  /** Side of the host the bubble is shown on. */
  readonly position = input<TooltipPosition>('top');
  /**
   * Visual tone. 'error' renders the bubble as a red error message (text-error
   * on a light surface with a red border) — used for unavailable-option hints
   * such as the heel-pad step. 'default' is the dark info bubble.
   */
  readonly tone = input<'default' | 'error'>('default');

  private bubble: HTMLElement | null = null;
  private readonly bubbleId = `nm-tooltip-${uid++}`;

  @HostListener('mouseenter')
  @HostListener('focus')
  protected show(): void {
    if (this.bubble) {
      return;
    }

    const bubble = this.renderer.createElement('div') as HTMLElement;
    const text = this.translation.translate(this.nmTooltip());
    this.renderer.appendChild(bubble, this.renderer.createText(text));
    this.renderer.setAttribute(bubble, 'role', 'tooltip');
    this.renderer.setAttribute(bubble, 'id', this.bubbleId);
    this.renderer.setStyle(bubble, 'position', 'absolute');
    // Constrain width so long copy wraps instead of overflowing the viewport.
    this.renderer.setStyle(bubble, 'max-width', 'min(400px, calc(100vw - 16px))');
    bubble.className =
      this.tone() === 'error'
        ? 'bg-surface text-error border border-error text-xs rounded px-2 py-1 shadow-soft z-popup pointer-events-none animate-in fade-in'
        : 'bg-ink text-content-inverse text-xs rounded px-2 py-1 shadow-soft z-popup pointer-events-none animate-in fade-in';

    this.renderer.appendChild(document.body, bubble);
    this.bubble = bubble;
    this.renderer.setAttribute(this.host.nativeElement, 'aria-describedby', this.bubbleId);
    this.position_(bubble);
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  protected hide(): void {
    if (this.bubble) {
      this.renderer.removeChild(document.body, this.bubble);
      this.bubble = null;
      this.renderer.removeAttribute(this.host.nativeElement, 'aria-describedby');
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }

  /**
   * Places the bubble using smart positioning: tries the preferred side first,
   * then falls back through top → bottom → right → left, picking the first side
   * that fits in the viewport. The chosen coordinates are then clamped so the
   * bubble never overflows the viewport edges.
   */
  private position_(bubble: HTMLElement): void {
    const host = this.host.nativeElement.getBoundingClientRect();
    const rect = bubble.getBoundingClientRect();
    const gap = 8;
    const margin = 8;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // Preferred side first, then the fixed top → bottom → right → left order.
    const order: TooltipPosition[] = ['top', 'bottom', 'right', 'left'];
    const candidates = [this.position(), ...order.filter(p => p !== this.position())];

    const coordsFor = (side: TooltipPosition): { top: number; left: number } => {
      switch (side) {
        case 'bottom':
          return { top: host.bottom + gap, left: host.left + host.width / 2 - rect.width / 2 };
        case 'left':
          return {
            top: host.top + host.height / 2 - rect.height / 2,
            left: host.left - rect.width - gap,
          };
        case 'right':
          return { top: host.top + host.height / 2 - rect.height / 2, left: host.right + gap };
        case 'top':
        default:
          return {
            top: host.top - rect.height - gap,
            left: host.left + host.width / 2 - rect.width / 2,
          };
      }
    };

    const fits = (side: TooltipPosition): boolean => {
      switch (side) {
        case 'top':
          return host.top - gap - rect.height >= margin;
        case 'bottom':
          return host.bottom + gap + rect.height <= vh - margin;
        case 'right':
          return host.right + gap + rect.width <= vw - margin;
        case 'left':
          return host.left - gap - rect.width >= margin;
      }
    };

    const side = candidates.find(fits) ?? this.position();
    const { top, left } = coordsFor(side);

    // Clamp into the viewport so the bubble is always fully visible.
    const clampedLeft = Math.min(
      Math.max(left, margin),
      Math.max(margin, vw - rect.width - margin)
    );
    const clampedTop = Math.min(Math.max(top, margin), Math.max(margin, vh - rect.height - margin));

    this.renderer.setStyle(bubble, 'top', `${clampedTop + window.scrollY}px`);
    this.renderer.setStyle(bubble, 'left', `${clampedLeft + window.scrollX}px`);
  }
}
