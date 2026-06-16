/*
 * EN: Phone-input country dropdown opener (CDK Overlay). Renders the dropdown
 *     template in the global overlay container — above all content and never
 *     clipped by an ancestor `overflow: hidden` (fixes the old absolute-panel
 *     z-index/clipping bug). The panel is flexibly connected to the trigger
 *     (prefers below, falls back above) and closes on scroll so it can't float
 *     away from the input. Only one dropdown is open at a time.
 * RU: Открыватель выпадающего списка стран для ввода телефона (CDK Overlay).
 *     Рендерит шаблон в глобальном контейнере overlay — поверх всего контента и
 *     без обрезки родительским `overflow: hidden` (чинит старый баг z-index/
 *     обрезки абсолютной панели). Панель гибко привязана к триггеру (снизу, при
 *     нехватке места — сверху) и закрывается при прокрутке, чтобы не «уплывать»
 *     от поля. Одновременно открыт только один список.
 */
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import type { ElementRef, TemplateRef, ViewContainerRef } from '@angular/core';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PhoneDropdownService {
  private readonly overlay = inject(Overlay);
  private overlayRef: OverlayRef | null = null;

  /**
   * Opens `template` in an overlay anchored to `origin`. Returns the OverlayRef
   * so the caller can subscribe to `backdropClick()` / `detachments()` (the
   * latter also fires on scroll-close). Disposes any previously open dropdown.
   */
  open(
    origin: ElementRef<HTMLElement>,
    template: TemplateRef<unknown>,
    viewContainerRef: ViewContainerRef
  ): OverlayRef {
    this.close();

    // Anchor to the whole field (the trigger's parent), not the narrow country
    // button, so the panel aligns with the input and matches its width.
    const field = origin.nativeElement.parentElement ?? origin.nativeElement;

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(field)
      .withPositions([
        // Preferred: directly below the field, left-aligned.
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        // Fallback: directly above the field when there isn't room below.
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ])
      // Flexible dimensions: shrink the panel to the space left above/below the
      // trigger so it always fits *anchored to the field* (search box stays
      // visible, the list scrolls). Paired with withPush(false) this is the fix
      // for the panel detaching and floating to the top of the viewport when it
      // was taller than the available space.
      .withFlexibleDimensions(true)
      .withGrowAfterOpen(false)
      .withViewportMargin(8)
      .withPush(false);

    const overlayRef = this.overlay.create({
      positionStrategy,
      // Close (not reposition) on scroll so the panel never floats away.
      scrollStrategy: this.overlay.scrollStrategies.close(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: 'nm-phone-dropdown',
      // Pin the panel to the field width (min 320px so it stays usable on narrow
      // fields) so long country names truncate instead of widening past the edge.
      width: Math.max(field.offsetWidth, 320),
    });

    overlayRef.attach(new TemplatePortal(template, viewContainerRef));
    this.overlayRef = overlayRef;
    return overlayRef;
  }

  /** Disposes the open dropdown (no-op if none). */
  close(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
