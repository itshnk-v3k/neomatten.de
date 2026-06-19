/*
 * EN: Transactional email service. A mock seam for the future backend SMTP: it
 *     builds the business notification + customer confirmation for a completed
 *     configurator inquiry and "sends" them (logged to the console for now).
 *     Swap the `deliver()` body for a real HTTP call when the backend lands —
 *     the call sites and payload shape stay the same.
 * RU: Сервис транзакционных писем. Мок-точка под будущий SMTP бэкенда: формирует
 *     уведомление бизнесу + подтверждение клиенту по завершённой заявке
 *     конфигуратора и «отправляет» их (пока — в консоль). При появлении бэкенда
 *     меняется только тело `deliver()`; вызовы и форма данных не меняются.
 */
import { inject, Injectable } from '@angular/core';
import { COMPANY_INFO } from '@core/config/company-info';
import { TranslationService } from '@core/i18n/translation.service';
import type { HeelPad, MatKitPiece, MatKitTier } from '@core/models/vehicle.model';

/** Customer contact details captured by the configurator form. */
export interface CustomerContact {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
}

/** A completed configurator order, sent to the business and confirmed to the customer. */
export interface ConfiguratorInquiry {
  readonly brand: string;
  readonly model: string;
  readonly yearRange: string;
  readonly sku: string | null;
  readonly heelPad: HeelPad | null;
  readonly tier: MatKitTier;
  readonly pieces: readonly MatKitPiece[];
  readonly color?: string;
  readonly customer: CustomerContact;
}

interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private readonly translation = inject(TranslationService);

  /**
   * Sends both the business notification and the customer confirmation for a
   * configurator inquiry. Resolves once both are "delivered" (mock).
   */
  async sendConfiguratorInquiry(inquiry: ConfiguratorInquiry): Promise<void> {
    await Promise.all([
      this.deliver(this.businessNotification(inquiry)),
      this.deliver(this.customerConfirmation(inquiry)),
    ]);
  }

  /** Localized, human-readable summary of the chosen configuration. */
  private summary(inquiry: ConfiguratorInquiry): string {
    const t = (key: string): string => this.translation.translate(key);
    const lines = [
      `${t('configurator_summary_vehicle')}: ${inquiry.brand} ${inquiry.model} (${inquiry.yearRange})`,
      `${t('form_label_sku')}: ${inquiry.sku ?? '—'}`,
      `${t('configurator_step_heel_pad')}: ${inquiry.heelPad ? t(`heel_pad_${inquiry.heelPad}`) : '—'}`,
      `${t('configurator_step_tier')}: ${t(`mat_kit_tier_${inquiry.tier}`)}`,
      `${t('configurator_step_pieces')}: ${inquiry.pieces.map(p => t(`mat_kit_piece_${p}`)).join(', ')}`,
    ];
    if (inquiry.color) {
      lines.push(`${t('configurator_step_color')}: ${t(`mat_color_${inquiry.color}`)}`);
    }
    return lines.join('\n');
  }

  private businessNotification(inquiry: ConfiguratorInquiry): EmailMessage {
    const { customer } = inquiry;
    const contact = [
      `${this.translation.translate('form_name')}: ${customer.name}`,
      `${this.translation.translate('form_email')}: ${customer.email}`,
      `${this.translation.translate('form_phone')}: ${customer.phone || '—'}`,
    ].join('\n');
    return {
      to: COMPANY_INFO.email,
      subject: `${this.translation.translate('email_business_subject')} — ${inquiry.brand} ${inquiry.model}`,
      body: `${this.summary(inquiry)}\n\n${contact}`,
    };
  }

  private customerConfirmation(inquiry: ConfiguratorInquiry): EmailMessage {
    return {
      to: inquiry.customer.email,
      subject: this.translation.translate('email_customer_subject'),
      body: `${this.translation.translate('email_customer_intro')}\n\n${this.summary(inquiry)}\n\n${this.translation.translate('email_customer_outro')}`,
    };
  }

  /**
   * Sends the password-reset email with a (mock) reset link carrying the token.
   * Mock seam — the real backend creates the token and sends the mail; the
   * client only fires POST /auth/forgot. Swap `deliver()` for the real mailer.
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `https://${COMPANY_INFO.brand.toLowerCase()}.de/account/reset?token=${token}`;
    await this.deliver({
      to: email,
      subject: this.translation.translate('email_reset_subject'),
      body: `${this.translation.translate('email_reset_body')}\n\n${link}`,
    });
  }

  /**
   * Notifies the business that an order needs manager follow-up (the
   * "Contact manager" checkout path). Mock seam — swap `deliver()` for HTTP.
   */
  async notifyManager(orderId: string, total: number, customerEmail?: string): Promise<void> {
    await this.deliver({
      to: COMPANY_INFO.email,
      subject: `${this.translation.translate('email_manager_subject')} — ${orderId}`,
      body: `${this.translation.translate('email_manager_body')}\nOrder: ${orderId}\nTotal: ${total} EUR\nCustomer: ${customerEmail ?? '—'}`,
    });
  }

  /**
   * Mock delivery (logs to the console).
   * TODO(backend): replace with a real HTTP call to the backend mailer
   * (e.g. `this.api.post('/email/send', message)`); call sites stay the same.
   */
  private deliver(message: EmailMessage): Promise<void> {
    console.info(
      '[EmailService] mock send →',
      message.to,
      '\n',
      message.subject,
      '\n',
      message.body
    );
    return Promise.resolve();
  }
}
