/*
 * EN: Accordion item for the shared UI kit. A single collapsible section with a
 *     full-width header button (rotating chevron) toggling its `open` state and
 *     a smoothly animated body that projects <ng-content>.
 * RU: Элемент аккордеона общего UI-кита. Одна сворачиваемая секция с кнопкой-
 *     заголовком на всю ширину (вращающийся шеврон), переключающей состояние
 *     `open`, и плавно анимированным телом, проецирующим <ng-content>.
 */
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { LucideChevronDown } from '@lucide/angular';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

let uid = 0;

@Component({
  selector: 'nm-accordion-item',
  imports: [LucideChevronDown, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accordion-item.component.html',
  styleUrl: './accordion-item.component.scss',
  host: {
    class: 'block border-b border-border',
  },
})
export class AccordionItemComponent {
  /** Header label as a translation key. */
  readonly titleKey = input<string>('');
  readonly open = model<boolean>(false);

  /** Unique id linking the header trigger to the collapsible region. */
  protected readonly panelId = `nm-accordion-panel-${uid++}`;

  protected toggle(): void {
    this.open.update(value => !value);
  }
}
