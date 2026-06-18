/*
 * EN: Contact-form topics — the single source of truth shared by the /contact
 *     page and the home lead form, so the topic dropdown options can never drift
 *     apart. Each value maps to a `contact_topic_<value>` i18n key; some are also
 *     accepted `?topic=` deep-link query-param values (e.g. the lockout link from
 *     the auth dialog, the account-deletion link from the profile page).
 * RU: Темы формы контакта — единый источник для страницы /contact и формы заявки
 *     на главной, чтобы опции выпадающего списка не расходились. Значение → ключ
 *     i18n `contact_topic_<value>`; часть из них — значения query-параметра
 *     `?topic=` (ссылка о блокировке из диалога входа, удаление аккаунта из профиля).
 */
export const CONTACT_TOPICS = ['lockout', 'order_status', 'account_deletion', 'other'] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];
