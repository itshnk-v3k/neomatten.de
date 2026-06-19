/*
 * EN: FAQ page. Renders the seven question/answer pairs as a shared accordion
 *     (nm-accordion + nm-accordion-item). All copy comes from the shared
 *     faq_q… / faq_a… translate keys (DE/EN), reused from the home-page FAQ.
 * RU: Страница «Частые вопросы». Показывает семь пар вопрос/ответ как общий
 *     аккордеон (nm-accordion + nm-accordion-item). Весь текст — из общих ключей
 *     перевода faq_q… / faq_a… (DE/EN), используемых и на главной странице.
 */
import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslationService } from '@core/i18n/translation.service';
import { SchemaService } from '@core/services/schema.service';
import { AccordionComponent } from '@shared/components/accordion/accordion.component';
import { AccordionItemComponent } from '@shared/components/accordion-item/accordion-item.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/** A single FAQ entry: question + answer translate keys. */
interface FaqEntry {
  readonly questionKey: string;
  readonly answerKey: string;
}

@Component({
  selector: 'nm-faq-page',
  imports: [
    AccordionComponent,
    AccordionItemComponent,
    BreadcrumbComponent,
    SkeletonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent {
  protected readonly faqEntries: readonly FaqEntry[] = Array.from({ length: 7 }, (_, i) => ({
    questionKey: `faq_q${i + 1}`,
    answerKey: `faq_a${i + 1}`,
  }));

  /** Local loading flag (no backing service): briefly shows skeletons on render. */
  protected readonly loading = signal(true);

  private readonly translation = inject(TranslationService);
  private readonly schema = inject(SchemaService);

  constructor() {
    // afterNextRender fires after the router's NavigationEnd (which resets the
    // page-level JSON-LD), so the FAQ schema we publish here is not wiped.
    afterNextRender(() => {
      setTimeout(() => this.loading.set(false), 600);
      this.schema.setFaq(
        this.faqEntries.map(entry => ({
          question: this.translation.translate(entry.questionKey),
          answer: this.translation.translate(entry.answerKey),
        }))
      );
    });
  }
}
