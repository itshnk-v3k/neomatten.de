/*
 * EN: Home "guarantee" section — three trust pillars (material, exchange,
 *     original) with icons over a dark gradient. Static content.
 * RU: Секция «гарантия» главной — три столпа доверия (материал, обмен,
 *     оригинал) с иконками на тёмном градиенте. Статика.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAward, LucideRefreshCw, LucideShield } from '@lucide/angular';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-home-guarantee',
  imports: [TranslatePipe, RevealOnScrollDirective, LucideShield, LucideRefreshCw, LucideAward],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guarantee.component.html',
  styleUrl: './guarantee.component.scss',
})
export class GuaranteeComponent {}
