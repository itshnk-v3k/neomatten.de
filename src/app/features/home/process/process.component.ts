/*
 * EN: Home "process" section — four numbered steps (brief, call, craft, deliver)
 *     joined by decorative connectors. Static content over a dark gradient.
 * RU: Секция «процесс» главной — четыре шага (бриф, звонок, изготовление,
 *     доставка) с декоративными коннекторами. Статика на тёмном градиенте.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideClipboard, LucidePhone, LucideTruck, LucideWrench } from '@lucide/angular';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-home-process',
  imports: [
    TranslatePipe,
    RevealOnScrollDirective,
    LucideClipboard,
    LucidePhone,
    LucideWrench,
    LucideTruck,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './process.component.html',
  styleUrl: './process.component.scss',
})
export class ProcessComponent {}
