/*
 * EN: Home FAQ teaser section. Renders the shared faq_q…/faq_a… keys (DE/EN) as
 *     an accordion; the same keys back the dedicated /faq page.
 * RU: Тизер-секция FAQ главной. Показывает общие ключи faq_q…/faq_a… (DE/EN) как
 *     аккордеон; те же ключи используются на отдельной странице /faq.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AccordionComponent } from '@shared/components/accordion/accordion.component';
import { AccordionItemComponent } from '@shared/components/accordion-item/accordion-item.component';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/** A single FAQ entry (question + answer translation keys). */
interface FaqEntry {
  readonly questionKey: string;
  readonly answerKey: string;
}

@Component({
  selector: 'nm-home-faq',
  imports: [TranslatePipe, RevealOnScrollDirective, AccordionComponent, AccordionItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
})
export class FaqSectionComponent {
  /** FAQ teaser entries (shared keys, reused by the dedicated FAQ page). */
  protected readonly faqEntries: readonly FaqEntry[] = [
    { questionKey: 'faq_q1', answerKey: 'faq_a1' },
    { questionKey: 'faq_q2', answerKey: 'faq_a2' },
    { questionKey: 'faq_q3', answerKey: 'faq_a3' },
    { questionKey: 'faq_q4', answerKey: 'faq_a4' },
    { questionKey: 'faq_q5', answerKey: 'faq_a5' },
    { questionKey: 'faq_q6', answerKey: 'faq_a6' },
    { questionKey: 'faq_q7', answerKey: 'faq_a7' },
  ];
}
