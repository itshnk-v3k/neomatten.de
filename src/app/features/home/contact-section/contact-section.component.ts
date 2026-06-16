/*
 * EN: Home contact section — company address/hours/phone/email beside a stacked
 *     lead form (with consent). Contact details come from COMPANY_INFO.
 * RU: Секция контактов главной — адрес/часы/телефон/email компании рядом с
 *     вертикальной формой заявки (с согласием). Данные — из COMPANY_INFO.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMPANY_INFO, COMPANY_PHONE_HREF } from '@core/config/company-info';
import { LucideMail, LucideMapPin, LucidePhone } from '@lucide/angular';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

import { LeadFormComponent } from '../lead-form/lead-form.component';

@Component({
  selector: 'nm-home-contact',
  imports: [
    TranslatePipe,
    RevealOnScrollDirective,
    LeadFormComponent,
    LucideMapPin,
    LucidePhone,
    LucideMail,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-section.component.html',
  styleUrl: './contact-section.component.scss',
})
export class ContactSectionComponent {
  protected readonly company = COMPANY_INFO;
  protected readonly phoneHref = COMPANY_PHONE_HREF;
}
