/*
 * EN: Complete country list for the international phone input. Built once at
 *     module load from libphonenumber-js (`getCountries()` + calling codes) so it
 *     always matches the library's validation/formatting. Each entry carries the
 *     ISO code, dial/phone code, flag emoji and a localized (German) display name.
 *     Sorted with the NEOMATTEN target-market countries first (DE, AT, CH, MD),
 *     then alphabetically by name.
 * RU: Полный список стран для международного ввода телефона. Строится один раз при
 *     загрузке модуля из libphonenumber-js (`getCountries()` + коды) — всегда
 *     совпадает с валидацией/форматированием библиотеки. У каждой записи ISO-код,
 *     код набора, эмодзи-флаг и локализованное (немецкое) название. Сортировка:
 *     сначала целевые страны NEOMATTEN (DE, AT, CH, MD), затем по алфавиту.
 */
import { type CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js';

export interface Country {
  readonly code: CountryCode;
  /** Calling code without the plus, e.g. "49". */
  readonly dialCode: string;
  /** Calling code with the plus, e.g. "+49". */
  readonly phoneCode: string;
  readonly flag: string;
  /** Localized (German) country name, e.g. "Deutschland". */
  readonly name: string;
}

/** Regional-indicator flag emoji from an ISO 3166-1 alpha-2 code. */
function getFlagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/** Target-market countries pinned to the top of the list, in this order. */
const PRIORITY_CODES: readonly CountryCode[] = ['DE', 'AT', 'CH', 'MD'];

const regionNames = new Intl.DisplayNames(['de'], { type: 'region' });

/** Every country libphonenumber-js knows, priority-sorted then alphabetical. */
export const ALL_COUNTRIES: readonly Country[] = (() => {
  const list: Country[] = getCountries().map(code => ({
    code,
    dialCode: getCountryCallingCode(code),
    phoneCode: `+${getCountryCallingCode(code)}`,
    flag: getFlagEmoji(code),
    name: regionNames.of(code) ?? code,
  }));

  const priority = PRIORITY_CODES.map(code => list.find(c => c.code === code)).filter(
    (c): c is Country => c !== undefined
  );
  const rest = list
    .filter(c => !PRIORITY_CODES.includes(c.code))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return [...priority, ...rest];
})();

/** Lookup a country by ISO code (falls back to undefined). */
export function findCountry(code: CountryCode): Country | undefined {
  return ALL_COUNTRIES.find(c => c.code === code);
}
