/*
 * EN: Accordion container for the shared UI kit. A bordered, rounded wrapper that
 *     projects multiple <nm-accordion-item> elements; each item manages its own
 *     open state, so no single-open coordination is performed here.
 * RU: Контейнер аккордеона общего UI-кита. Обёртка с границей и скруглением,
 *     проецирующая несколько <nm-accordion-item>; каждый элемент управляет своим
 *     состоянием open, поэтому согласования «один открытый» здесь нет.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'nm-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.scss',
  host: {
    class: 'block overflow-hidden rounded-md border border-border divide-y divide-border',
  },
})
export class AccordionComponent {}
