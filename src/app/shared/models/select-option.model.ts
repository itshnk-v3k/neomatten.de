/*
 * EN: Generic option shape consumed by select, radio-group and similar form
 *     controls in the shared UI kit. `label` is a display string (already
 *     translated by the caller); `value` is the bound form value.
 * RU: Универсальная структура опции для select, radio-group и подобных контролов
 *     общего UI-кита. `label` — отображаемая строка (уже переведённая вызывающей
 *     стороной); `value` — значение, привязанное к форме.
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
