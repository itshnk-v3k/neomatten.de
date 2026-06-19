/*
 * EN: Lazy-section directive. Emits `sectionVisible` once, the first time the host
 *     element scrolls near the viewport (IntersectionObserver, with a configurable
 *     `rootMargin` preload buffer), then unobserves. Lets heavy/data-driven
 *     sections defer their work (carousel init, service load) until the user is
 *     about to reach them. Reveals immediately when IntersectionObserver is
 *     unavailable (SSR / old browsers) so content is never withheld.
 * RU: Директива ленивой секции. Эмитит `sectionVisible` один раз — при первом
 *     приближении host-элемента к вьюпорту (IntersectionObserver с настраиваемым
 *     буфером предзагрузки `rootMargin`), затем отписывается. Позволяет тяжёлым/
 *     управляемым данными секциям откладывать работу (инициализацию каруселей,
 *     загрузку сервисов), пока пользователь не подойдёт к ним. При отсутствии
 *     IntersectionObserver (SSR / старые браузеры) показывает сразу.
 */
import {
  Directive,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  type OnInit,
  output,
} from '@angular/core';

@Directive({
  selector: '[nmLazySection]',
})
export class LazySectionDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Fires once, the first time the host scrolls near the viewport. */
  readonly sectionVisible = output<void>();
  /** Preload margin — triggers this far before the element actually enters view. */
  readonly rootMargin = input<string>('200px');

  private observer?: IntersectionObserver;
  private triggered = false;

  ngOnInit(): void {
    // SSR / unsupported: reveal immediately so content is never withheld.
    if (typeof IntersectionObserver === 'undefined') {
      this.trigger();
      return;
    }
    this.observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          this.trigger();
        }
      },
      { rootMargin: this.rootMargin() }
    );
    this.observer.observe(this.el.nativeElement);
  }

  private trigger(): void {
    if (this.triggered) {
      return;
    }
    this.triggered = true;
    this.sectionVisible.emit();
    this.observer?.disconnect();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
