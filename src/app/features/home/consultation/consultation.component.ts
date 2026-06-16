/*
 * EN: Home consultation section — a dark, poster-backed band with the lead form
 *     (grid layout). Anchored as #beratung, the scroll target of the hero CTA.
 * RU: Секция консультации главной — тёмная полоса с фоновым постером и формой
 *     заявки (сетка). Якорь #beratung — цель прокрутки CTA в геро-секции.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

import { LeadFormComponent } from '../lead-form/lead-form.component';

@Component({
  selector: 'nm-home-consultation',
  imports: [NgOptimizedImage, TranslatePipe, RevealOnScrollDirective, LeadFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.scss',
})
export class ConsultationComponent {
  /** Background poster (real content asset; shared with the hero). */
  protected readonly heroPoster = 'assets/content/hero-poster.jpg';
}
