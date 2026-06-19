/*
 * EN: Customer review model. A star rating (1–5), author name, free text and a
 *     display date string.
 * RU: Модель отзыва клиента. Оценка в звёздах (1–5), имя автора, свободный текст
 *     и строка даты для отображения.
 */
export interface Review {
  readonly name: string;
  readonly text: string;
  readonly rating: number;
  readonly date: string;
}
