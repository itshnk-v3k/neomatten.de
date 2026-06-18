/*
 * EN: Formats a numeric euro amount with exactly two decimals and the € symbol,
 *     e.g. 188.1 → "188.10 €". Single source of truth so prices never render with
 *     a stray one-/zero-decimal amount. Nullish/NaN → "0.00 €".
 * RU: Форматирует сумму в евро ровно с двумя знаками после запятой и символом €,
 *     напр. 188.1 → «188.10 €». Единый источник форматирования цен, чтобы суммы
 *     не выводились с одним/нулём знаков. Nullish/NaN → «0.00 €».
 */
import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({ name: 'euro' })
export class EuroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return `${amount.toFixed(2)} €`;
  }
}
