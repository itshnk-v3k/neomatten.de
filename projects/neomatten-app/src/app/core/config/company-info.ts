/*
 * EN: Static company contact details (phone, email, address, socials). Plain
 *     data — not translated; will become admin-managed settings with the backend.
 * RU: Статичные контактные данные компании (телефон, email, адрес, соцсети).
 *     Обычные данные — не переводятся; станут настройками из админки с бэкендом.
 */
export const COMPANY_INFO = {
  brand: 'NEOMATTEN',
  /** Canonical production origin (no trailing slash) — used for SEO canonical /
   *  hreflang links, Open Graph URLs and JSON-LD structured data. */
  siteUrl: 'https://neomatten.de',
  phone: '+49 177 2140083',
  email: 'neomatten.de@gmail.com',
  /** Messaging channels (also surfaced on the contact page). */
  telegram: 'https://t.me/neomatten_de',
  whatsapp: 'https://wa.me/491772140083',
  address: {
    street: 'Musterstraße 42',
    city: '10115 Berlin',
    /** Country label is rendered via the `footer_country` translation key. */
  },
  social: [
    {
      id: 'instagram',
      label: 'Instagram',
      url: 'https://www.instagram.com/neomattendeutschland?igsh=NmI0YmlxdmtnZWJ2',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      url: 'https://www.tiktok.com/@neomattenberlin?_r=1&_t=ZG-97CdQDgWFOK',
    },
    { id: 'telegram', label: 'Telegram', url: 'https://t.me/neomatten_de' },
    { id: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/491772140083' },
  ],
} as const;

/** `tel:` href with spaces stripped, for click-to-call. */
export const COMPANY_PHONE_HREF = `tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`;

/**
 * Google Maps search link for the company address (opens in a new tab). Update
 * when the real address lands — the query is derived from COMPANY_INFO.address.
 */
export const COMPANY_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${COMPANY_INFO.address.street}, ${COMPANY_INFO.address.city}`
)}`;
