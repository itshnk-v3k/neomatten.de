/*
 * EN: Home "advantages" section. Two icon-text columns flanking a central
 *     showcase image, with a configurator CTA below. Static content only.
 * RU: Секция «преимущества» главной. Две колонки «иконка-текст» по бокам от
 *     центрального изображения, ниже — CTA на конфигуратор. Только статика.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  protected readonly advantagesImage = 'assets/content/carpet.jpg';
}
