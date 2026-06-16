/*
 * EN: Scroll-reveal directive. Fades/slides its host element in the first time it
 *     enters the viewport (IntersectionObserver), then unobserves. Ports the
 *     legacy main.js initScrollAnimations(); degrades to instantly visible when
 *     IntersectionObserver is unavailable. Respects prefers-reduced-motion.
 * RU: Директива появления при прокрутке. Плавно показывает host-элемент при
 *     первом попадании во вьюпорт (IntersectionObserver), затем отписывается.
 *     Портирует устаревший initScrollAnimations() из main.js; при отсутствии
 *     IntersectionObserver сразу показывает. Учитывает prefers-reduced-motion.
 */
import { type AfterViewInit, Directive, ElementRef, inject, type OnDestroy } from '@angular/core';

@Directive({
  selector: '[nmReveal]',
})
export class RevealOnScrollDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.host.nativeElement;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      return;
    }

    node.classList.add('opacity-0');
    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.reveal(node);
            this.observer?.unobserve(node);
          }
        }
      },
      { threshold: 0.12 }
    );
    this.observer.observe(node);
  }

  private reveal(node: HTMLElement): void {
    node.classList.remove('opacity-0');
    node.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-4', 'duration-700');
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
