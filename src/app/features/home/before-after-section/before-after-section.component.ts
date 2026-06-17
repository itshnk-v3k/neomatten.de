/*
 * EN: Home before/after section — wraps the shared nm-before-after slider with a
 *     section heading. Shows a real worn-carpet → new-EVA comparison; the slider
 *     falls back to nm-image-placeholder per image if a file fails to load.
 * RU: Секция «до/после» главной — оборачивает общий слайдер nm-before-after с
 *     заголовком. Показывает реальное сравнение изношенного ворса → новой EVA;
 *     слайдер откатывается к nm-image-placeholder по каждому изображению при сбое.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BeforeAfterComponent } from '@shared/components/before-after/before-after.component';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-home-before-after',
  imports: [TranslatePipe, RevealOnScrollDirective, BeforeAfterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './before-after-section.component.html',
  styleUrl: './before-after-section.component.scss',
})
export class BeforeAfterSectionComponent {
  /** Before/after comparison photos (worn carpet mat → new EVA mat installed). */
  protected readonly beforeImage =
    'assets/images/before-after/mercedes-benz-b-class-2018-front-left-before.jpg';
  protected readonly afterImage =
    'assets/images/before-after/mercedes-benz-b-class-2018-front-left-after.jpg';
}
