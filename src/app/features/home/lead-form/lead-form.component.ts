/*
 * EN: Lead capture form (consultation + contact). Reactive Forms with the shared
 *     input/button kit; name + email are required (email validated). On submit it
 *     shows a success toast and resets — a mock seam for the future backend.
 *     Ports the legacy submitConsult() handler shared by both home forms.
 * RU: Форма захвата заявки (консультация + контакт). Reactive Forms с общим
 *     набором input/button; имя и e-mail обязательны (e-mail проверяется). По
 *     отправке показывает тост успеха и сбрасывается — точка подмены под будущий
 *     бэкенд. Портирует устаревший обработчик submitConsult(), общий для обеих форм.
 */
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CONTACT_TOPICS } from '@core/config/contact-topics';
import { TranslationService } from '@core/i18n/translation.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { InputComponent } from '@shared/components/input/input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { SelectComponent } from '@shared/components/select/select.component';
import type { SelectOption } from '@shared/models/select-option.model';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { createAsyncAction } from '@shared/utils/async-action.util';
import { phoneValidator } from '@shared/validators/phone.validator';

@Component({
  selector: 'nm-lead-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputComponent,
    PhoneInputComponent,
    SelectComponent,
    CheckboxComponent,
    ButtonDirective,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lead-form.component.html',
  styleUrl: './lead-form.component.scss',
})
export class LeadFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly translation = inject(TranslationService);

  /** Placeholder/aria key for the vehicle field (differs per form). */
  readonly vehiclePlaceholderKey = input<string>('home_consult_vehicle');
  /** When true, requires a data-processing consent checkbox (contact form). */
  readonly showConsent = input<boolean>(false);
  /** When true, shows a required topic dropdown (contact form). */
  readonly showTopic = input<boolean>(false);
  /** Layout: two-column grid (consultation) or stacked column (contact). */
  readonly layout = input<'grid' | 'stacked'>('grid');
  /** When true, renders labels/hints in light colors for a dark-background section. */
  readonly dark = input<boolean>(false);

  /** Topic options (labels re-resolve on language change). */
  protected readonly topicOptions = computed<SelectOption[]>(() => {
    this.translation.currentLanguage();
    return CONTACT_TOPICS.map(value => ({
      value,
      label: this.translation.translate(`contact_topic_${value}`),
    }));
  });

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', phoneValidator()],
    topic: [''],
    vehicle: [''],
    consent: [false],
  });

  constructor() {
    // The consent checkbox is only shown — and only required — when showConsent.
    effect(() => {
      const consent = this.form.controls.consent;
      consent.setValidators(this.showConsent() ? Validators.requiredTrue : null);
      consent.updateValueAndValidity({ emitEvent: false });
    });
    // The topic dropdown is only shown — and only required — when showTopic.
    effect(() => {
      const topic = this.form.controls.topic;
      topic.setValidators(this.showTopic() ? Validators.required : null);
      topic.updateValueAndValidity({ emitEvent: false });
    });
  }

  /** Guarded submit (minDurationMs floor debounces a rapid double-click). */
  protected readonly submitAction = createAsyncAction(
    () => {
      this.toast.success('home_consult_success');
      this.form.reset();
    },
    { minDurationMs: 500 }
  );

  protected submit(): void {
    if (this.form.invalid) {
      // Reveal inline field errors and warn via a toast; block submission.
      this.form.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    void this.submitAction.execute();
  }
}
