/*
 * EN: Contact page. Company details from COMPANY_INFO (address, phone, email,
 *     hours), a Leaflet map, and a Reactive-Forms contact form (name, email,
 *     phone, vehicle, message) built from the shared UI kit. Invalid submit
 *     marks all touched and toasts; a valid submit toasts success and resets.
 * RU: Страница «Контакты». Данные компании из COMPANY_INFO (адрес, телефон,
 *     e-mail, часы), карта Leaflet и форма на Reactive Forms (имя, e-mail,
 *     телефон, авто, сообщение) из общего UI-кита. Невалидная отправка помечает
 *     все поля и показывает тост; валидная — тост успеха и сброс.
 */
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { COMPANY_INFO, COMPANY_MAPS_URL, COMPANY_PHONE_HREF } from '@core/config/company-info';
import { TranslationService } from '@core/i18n/translation.service';
import { BrandIconComponent } from '@shared/components/brand-icon/brand-icon.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { InputComponent } from '@shared/components/input/input.component';
import { MapComponent } from '@shared/components/map/map.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { SelectComponent } from '@shared/components/select/select.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TextareaComponent } from '@shared/components/textarea/textarea.component';
import type { SelectOption } from '@shared/models/select-option.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { createAsyncAction } from '@shared/utils/async-action.util';
import { phoneValidator } from '@shared/validators/phone.validator';
import { siTelegram, siWhatsapp } from 'simple-icons';

/** Allowed contact topics (also the query-param values accepted on /contact). */
const CONTACT_TOPICS = ['lockout', 'order_status', 'account_deletion', 'other'] as const;

@Component({
  selector: 'nm-contact-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BreadcrumbComponent,
    BrandIconComponent,
    InputComponent,
    PhoneInputComponent,
    SelectComponent,
    TextareaComponent,
    CheckboxComponent,
    ButtonDirective,
    MapComponent,
    SkeletonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);

  /** Topic options (labels re-resolve on language change). */
  protected readonly topicOptions = computed<SelectOption[]>(() => {
    this.translation.currentLanguage();
    return CONTACT_TOPICS.map(value => ({
      value,
      label: this.translation.translate(`contact_topic_${value}`),
    }));
  });

  protected readonly company = COMPANY_INFO;
  protected readonly phoneHref = COMPANY_PHONE_HREF;
  protected readonly mapsUrl = COMPANY_MAPS_URL;
  protected readonly mailHref = `mailto:${COMPANY_INFO.email}`;
  protected readonly whatsappHref = COMPANY_INFO.whatsapp;
  protected readonly telegramHref = COMPANY_INFO.telegram;
  protected readonly whatsappIcon = siWhatsapp;
  protected readonly telegramIcon = siTelegram;

  /** Berlin Mitte (placeholder until the real address coordinates land). */
  protected readonly mapLat = 52.5316;
  protected readonly mapLng = 13.3849;

  /** Local skeleton gate (no backing service); clears after the first render. */
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => setTimeout(() => this.loading.set(false), 600));
    // Pre-select the topic from the ?topic= query param (e.g. the lockout link).
    const topic = this.route.snapshot.queryParamMap.get('topic');
    if (topic && (CONTACT_TOPICS as readonly string[]).includes(topic)) {
      this.form.controls.topic.setValue(topic);
    }
  }

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', phoneValidator()],
    topic: ['', Validators.required],
    vehicle: [''],
    message: ['', Validators.required],
    consent: [false, Validators.requiredTrue],
  });

  protected get mapAria(): string {
    return this.translation.translate('contact_map_aria');
  }

  /** Guarded submit (minDurationMs floor debounces a rapid double-click). */
  protected readonly submitAction = createAsyncAction(
    () => {
      // TODO(backend): POST the message via ApiService (e.g. `/contact`) / EmailService.
      this.toast.success('contact_success');
      this.form.reset();
    },
    { minDurationMs: 500 }
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    void this.submitAction.execute();
  }
}
