/*
 * EN: Home / landing route shell. Composes the page from standalone section
 *     components (hero → advantages → process → categories → before/after →
 *     guarantee → gallery → reviews → payment → consultation → FAQ → contact).
 *     Each section is self-contained (own data/services/lazy state); SEO is set
 *     via the route's `data.seo`.
 * RU: Оболочка маршрута «Главная». Собирает страницу из standalone-секций (герой
 *     → преимущества → процесс → категории → до/после → гарантия → галерея →
 *     отзывы → оплата → консультация → FAQ → контакт). Каждая секция автономна
 *     (свои данные/сервисы/ленивое состояние); SEO задаётся через `data.seo`.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AdvantagesComponent } from '../advantages/advantages.component';
import { BeforeAfterSectionComponent } from '../before-after-section/before-after-section.component';
import { CategoriesComponent } from '../categories/categories.component';
import { ConsultationComponent } from '../consultation/consultation.component';
import { ContactSectionComponent } from '../contact-section/contact-section.component';
import { FaqSectionComponent } from '../faq-section/faq-section.component';
import { GallerySectionComponent } from '../gallery-section/gallery-section.component';
import { GuaranteeComponent } from '../guarantee/guarantee.component';
import { HeroComponent } from '../hero/hero.component';
import { PaymentDeliveryComponent } from '../payment-delivery/payment-delivery.component';
import { ProcessComponent } from '../process/process.component';
import { ReviewsSectionComponent } from '../reviews-section/reviews-section.component';

@Component({
  selector: 'nm-home-page',
  imports: [
    HeroComponent,
    AdvantagesComponent,
    ProcessComponent,
    CategoriesComponent,
    BeforeAfterSectionComponent,
    GuaranteeComponent,
    GallerySectionComponent,
    ReviewsSectionComponent,
    PaymentDeliveryComponent,
    ConsultationComponent,
    FaqSectionComponent,
    ContactSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {}
