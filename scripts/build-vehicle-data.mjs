/*
 * EN: Dev-time data pipeline. Normalizes the client's clean vehicle/mat-pattern
 *     export (_project-brief/instructions/neomatten_patterns.json — gitignored)
 *     into the mock JSON the app ships with:
 *       - src/assets/mock-data/vehicle-patterns.json  (flat, normalized patterns)
 *       - src/assets/mock-data/brands.json            (brand index + counts)
 *     Run with `npm run build:data` whenever the source export changes.
 *
 *     Normalization rules (see also core/models/vehicle.model.ts):
 *       - model/yearLabel are DERIVED from `name` (no explicit columns exist).
 *       - body type / heel pad / tier / kit piece / restyling map RU/UA/TR source
 *         values onto snake_case enum keys translated DE/EN in the UI.
 *       - brand + model names are kept verbatim (only attribute labels translate).
 * RU: Скрипт подготовки данных (дев-этап). Нормализует чистый экспорт клиента в
 *     mock JSON приложения. Запуск: `npm run build:data`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, '_project-brief/instructions/neomatten_patterns.json');
const OUT_PATTERNS = resolve(root, 'src/assets/mock-data/vehicle-patterns.json');
const OUT_BRANDS = resolve(root, 'src/assets/mock-data/brands.json');

// --- normalization lookup tables -------------------------------------------

const BODY_TYPE = new Map([
  ['Кроссовер', 'crossover'],
  ['CROSS', 'crossover'],
  ['Седан', 'sedan'],
  ['Хэтчбек', 'hatchback'],
  ['HBp', 'hatchback'],
  ['Минивэн', 'minivan'],
  ['MİNİVAN', 'minivan'],
  ['Miniven', 'minivan'],
  ['MİNİBUS', 'van'],
  ['MINIBUS', 'van'],
  ['minibus', 'van'],
  ['Универсал', 'wagon'],
  ['Купе', 'coupe'],
  ['Лифтбек', 'liftback'],
  ['Внедорожник', 'suv'],
  ['Пикап', 'pickup'],
  ['Кабриолет', 'cabrio'],
  ['CABRİOLET', 'cabrio'],
  ['Фургон', 'van'],
  // combined source values → primary component
  ['Хэтчбек/Седан', 'hatchback'],
  ['Седан/Универсал', 'sedan'],
  ['SD-HB', 'sedan'],
  ['SD/HB', 'sedan'],
]);

const HEEL_PAD = new Map([
  // Current export already uses the normalized keys; the legacy RU values are
  // kept so an older export still maps cleanly.
  ['none', 'none'],
  ['standard', 'standard'],
  ['3d', '3d'],
  ['Нет', 'none'],
  ['Есть', 'standard'],
  ['3D', '3d'],
]);

const TIER = new Map([
  ['Премиум', 'premium'],
  ['Стандарт', 'standard'],
  ['Эконом', 'economy'],
]);

const PIECE = new Map([
  ['Водительский', 'driver'],
  ['Пассажирский', 'passenger'],
  ['Задний левый', 'rear_left'],
  ['Задний правый', 'rear_right'],
  ['Перемычка', 'bridge'],
  ['Багажник', 'trunk'],
  ['Второй ряд', 'second_row'],
  ['Третий ряд', 'third_row'],
  ['Третій ряд', 'third_row'],
  ['Перший ряд', 'first_row'],
]);

const RESTYLING = new Map([
  ['До рестайлинга', 'pre'],
  ['Рестайлинг', '1'],
  ['2-й рестайлінг', '2'],
  ['3-й рестайлінг', '3'],
  ['6-й рестайлінг', '6'],
  // "Нет" / "Не було" carry no facelift info → left undefined
]);

// Brand display name → name prefix used inside the `name` column (where it differs).
const NAME_PREFIX = new Map([
  ['ВАЗ (Lada)', 'Лада'],
]);

// Canonicalize messy source brand spellings to a single display name BEFORE
// slugging, so casing/typo variants collapse into one brand (e.g. the three
// SsangYong spellings, and the truncated "Land" → "Land Rover").
const BRAND_CANON = new Map([
  ['SSANG', 'SsangYong'],
  ['ssang', 'SsangYong'],
  ['SsangYONG', 'SsangYong'],
  ['Land', 'Land Rover'],
  ['land', 'Land Rover'],
  // Mercedes-Benz + Renault typo/transliteration variants.
  ['mercedes', 'Mercedes-Benz'],
  ['mers', 'Mercedes-Benz'],
  ['mersedes', 'Mercedes-Benz'],
  ['reno', 'Renault'],
  // Real niche brands, fixed to clean display casing (slug is unaffected).
  ['dfsk', 'DFSK'],
  ['jaecoo', 'Jaecoo'],
  ['kgm', 'KGM'],
  ['khazar', 'Khazar'],
  ['seres', 'Seres'],
  ['swm', 'SWM'],
  ['relive', 'Relive'],
  // Turkish/Cyrillic look-alike spellings → canonical Latin brand (these otherwise
  // slug to garbage like "f-at"/"itroen" and miss their real logo).
  ['Çitroen', 'Citroen'],
  ['Fıat', 'Fiat'],
  ['Kıa', 'Kia'],
  ['Şkoda', 'Skoda'],
  ['DİHATSU', 'Daihatsu'],
  ['İnfinity', 'Infiniti'],
  ['Volkwagen', 'Volkswagen'],
  ['VW', 'Volkswagen'],
  ['vw', 'Volkswagen'],
  // DS Automobiles + its model-named variants → one "DS" brand.
  ['Ds3', 'DS'],
  ['DS7', 'DS'],
]);

// Cyrillic brand → stable latin slug fragment.
const BRAND_SLUG = new Map([
  ['ВАЗ', 'vaz'],
  ['ВАЗ (Lada)', 'vaz-lada'],
  ['ГАЗ', 'gaz'],
  ['ЗАЗ', 'zaz'],
  ['УАЗ', 'uaz'],
  ['Таврия', 'tavria'],
  ['Органайзер', 'organizer'],
]);

// --- helpers ----------------------------------------------------------------

const norm = s => s.normalize('NFKC').toLowerCase().replace(/i̇/g, 'i').trim();

function slugify(brand) {
  if (BRAND_SLUG.has(brand)) return BRAND_SLUG.get(brand);
  const s = brand
    .normalize('NFKC')
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'brand';
}

const YEAR_RE = /(?:\(\s*)?\b(?:19|20)\d{2}\b/;

/** Derive a model name: strip the brand prefix and the trailing "(years) body gen". */
function extractModel(entry) {
  const name = entry.name;
  const match = YEAR_RE.exec(name);
  let head = (match ? name.slice(0, match.index) : name).replace(/[\s(–-]+$/, '').trim();
  const prefix = NAME_PREFIX.get(entry.brand) ?? entry.brand;
  if (norm(head).startsWith(norm(prefix))) {
    head = head.slice(prefix.length).trim();
  } else {
    // Fall back to dropping the first token (the brand) when it doesn't match.
    const parts = head.split(/\s+/);
    head = parts.length > 1 ? parts.slice(1).join(' ') : head;
  }
  return head.replace(/\s{2,}/g, ' ').trim();
}

/** Resolve year bounds, parsing them out of the name when the columns are null. */
function yearBounds(entry) {
  let { year_from: from, year_to: to } = entry;
  if (from == null) {
    const nums = entry.name.match(/(?:19|20)\d{2}/g);
    if (nums?.length) {
      from = Number(nums[0]);
      to = nums.length > 1 ? Number(nums[1]) : null;
    }
  }
  return { from: from ?? null, to: to ?? null };
}

function yearLabel(from, to) {
  if (from == null) return null;
  return to == null ? `${from}–…` : `${from}–${to}`;
}

function mapList(values, table) {
  const out = [];
  for (const v of values) {
    const mapped = table.get(v);
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

// --- build ------------------------------------------------------------------

const source = JSON.parse(readFileSync(SRC, 'utf8'));
const patterns = [];
const brands = new Map(); // brandId -> { id, name, models:Set, patternCount }
let pad = String(source.length).length;

/** Canonical source brand (messy spellings folded). */
const canonBrand = entry => BRAND_CANON.get(entry.brand) ?? entry.brand;

/**
 * Pick the cleanest display name among casing variants that share a slug:
 * prefer a mixed-case form ("Audi" over "AUDI"/"audi"); otherwise prefer the
 * all-uppercase acronym ("BMW", "VW", "MG"); otherwise the first alphabetically.
 */
function pickDisplayName(names) {
  const list = [...names];
  const mixed = list.filter(n => n !== n.toUpperCase() && n !== n.toLowerCase());
  if (mixed.length) return mixed.sort((a, b) => a.localeCompare(b))[0];
  const upper = list.filter(n => n === n.toUpperCase());
  if (upper.length) return upper.sort((a, b) => a.localeCompare(b))[0];
  return list.sort((a, b) => a.localeCompare(b))[0];
}

// Pre-pass: collect the display-name variants per slug, then resolve one clean
// display name per brand so case-variant rows don't fork into separate brands.
const slugNames = new Map();
for (const entry of source) {
  const slug = slugify(canonBrand(entry));
  if (!slugNames.has(slug)) slugNames.set(slug, new Set());
  slugNames.get(slug).add(canonBrand(entry));
}
const displayBySlug = new Map([...slugNames].map(([slug, names]) => [slug, pickDisplayName(names)]));

source.forEach((entry, index) => {
  const brand = canonBrand(entry);
  const brandId = slugify(brand);
  const brandName = displayBySlug.get(brandId) ?? brand;
  const model = extractModel({ ...entry, brand }) || entry.name;
  const { from, to } = yearBounds(entry);

  const pattern = {
    id: `vp-${String(index + 1).padStart(pad, '0')}`,
    brandId,
    brandName,
    model,
    name: entry.name,
    bodyType: BODY_TYPE.get(entry.body_type ?? '') ?? null,
    heelPad: HEEL_PAD.get(entry.heel_pad) ?? null,
    restyling: RESTYLING.get(entry.restyling ?? '') ?? null,
    sku: entry.sku ?? null,
    trim: entry.trim ?? null,
    yearFrom: from,
    yearTo: to,
    yearLabel: yearLabel(from, to),
    tiers: mapList(entry.tiers ?? [], TIER),
    pieces: mapList(entry.kit_pieces ?? [], PIECE),
    notes: entry.notes ?? null,
  };
  patterns.push(pattern);

  const b = brands.get(brandId) ?? { id: brandId, name: brandName, models: new Set(), patternCount: 0 };
  b.models.add(model);
  b.patternCount += 1;
  brands.set(brandId, b);
});

const brandList = [...brands.values()]
  .map(b => ({ id: b.id, name: b.name, modelCount: b.models.size, patternCount: b.patternCount }))
  .sort((a, b) => a.name.localeCompare(b.name));

// 2-space indent + trailing newline to match Prettier (keeps the committed
// mock JSON lint-clean after a rebuild).
writeFileSync(OUT_PATTERNS, JSON.stringify(patterns, null, 2) + '\n');
writeFileSync(OUT_BRANDS, JSON.stringify(brandList, null, 2) + '\n');

// --- report -----------------------------------------------------------------

const unmappedBody = new Set();
source.forEach(e => {
  if (e.body_type && !BODY_TYPE.has(e.body_type)) unmappedBody.add(e.body_type);
});
console.log(`✔ ${patterns.length} patterns, ${brandList.length} brands`);
console.log(`  wrote ${OUT_PATTERNS.replace(root + '/', '')}`);
console.log(`  wrote ${OUT_BRANDS.replace(root + '/', '')}`);
console.log(`  patterns with SKU: ${patterns.filter(p => p.sku).length}`);
console.log(`  patterns missing body type: ${patterns.filter(p => !p.bodyType).length}`);
if (unmappedBody.size) console.log(`  ⚠ unmapped body types: ${[...unmappedBody].join(', ')}`);
