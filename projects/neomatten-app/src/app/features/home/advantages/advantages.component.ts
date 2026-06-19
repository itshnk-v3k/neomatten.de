/*
 * EN: Home "advantages" section. Two icon-text columns flanking a central
 *     showcase image, with a configurator CTA below. Static content only.
 * RU: Секция «преимущества» главной. Две колонки «иконка-текст» по бокам от
 *     центрального изображения, ниже — CTA на конфигуратор. Только статика.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAnchor,
  LucideDroplet,
  LucideLayoutGrid,
  LucideScissors,
  LucideThermometer,
  LucideZap,
} from '@lucide/angular';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { ImagePlaceholderComponent } from '@shared/components/image-placeholder/image-placeholder.component';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-home-advantages',
  imports: [
    NgOptimizedImage,
    RouterLink,
    TranslatePipe,
    RevealOnScrollDirective,
    ButtonDirective,
    ImagePlaceholderComponent,
    LucideLayoutGrid,
    LucideThermometer,
    LucideDroplet,
    LucideAnchor,
    LucideScissors,
    LucideZap,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './advantages.component.html',
  styleUrl: './advantages.component.scss',
})
export class AdvantagesComponent {
  /** Advantages "center" showcase image (real content asset, 1024×1024 square). */
  protected readonly advantagesImage = 'assets/images/content/carpet.webp';

  /** Flips true if the showcase image fails to load → render the placeholder. */
  protected readonly imageFailed = signal(false);
}
