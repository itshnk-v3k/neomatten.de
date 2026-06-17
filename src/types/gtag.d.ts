/*
 * EN: Global typings for the gtag.js (Google Analytics 4) snippet declared in
 *     index.html. Augments `Window` with the `dataLayer` queue and the `gtag`
 *     function so the app can call analytics without `any` casts. A plain ambient
 *     declaration (no imports/exports) so the augmentation is global.
 * RU: Глобальные типы для сниппета gtag.js (Google Analytics 4) из index.html.
 *     Расширяет `Window` очередью `dataLayer` и функцией `gtag`, чтобы вызывать
 *     аналитику без приведения к `any`. Объявление амбиентное (без import/export),
 *     поэтому расширение глобальное.
 */

/** The gtag.js command function (`gtag('event', 'name', {...})`, etc.). */
type GtagFn = (...args: unknown[]) => void;

interface Window {
  /** GA4 command queue populated by the inline snippet before gtag.js loads. */
  dataLayer: unknown[];
  /** Google Analytics command function. */
  gtag: GtagFn;
}
