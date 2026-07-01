// NEOMATTEN translations seed / migration.
//
// One-time import of the static i18n JSON dictionaries into the `translations`
// table so the copy can be edited from the admin panel (draft/publish workflow).
//
// - Reads the current static files from the main site's assets.
// - Flattens nested JSON into dot-notation keys (the current files are already
//   flat with snake_case keys, e.g. "header_nav_catalog"; the flatten step is
//   defensive for any future nesting).
// - Inserts one row per (key, locale) with value = the string and draftValue =
//   null. Baseline is "already published", so there is no pending change yet.
// - category = the first segment of the key (before the first "." or "_").
// - Idempotent: upsert on the [key, locale] unique constraint. Re-running does
//   NOT clobber existing rows (published copy / pending drafts are preserved).
//
// Run with: `npx ts-node prisma/seed-translations.ts`
//
// The original JSON files are intentionally kept as a runtime fallback until
// this pipeline is verified working end to end.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOCALES = ['de', 'en'] as const;
type Locale = (typeof LOCALES)[number];

/** Absolute path to a locale's static dictionary in the main site assets. */
function dictionaryPath(locale: Locale): string {
  return resolve(
    __dirname,
    '../../projects/neomatten-app/src/assets/i18n',
    locale,
    'common.json',
  );
}

/**
 * Flattens a (possibly) nested translation object into dot-notation keys.
 * Already-flat dictionaries pass through unchanged.
 */
function flatten(
  input: Record<string, unknown>,
  prefix = '',
  out: Record<string, string> = {},
): Record<string, string> {
  for (const [key, val] of Object.entries(input)) {
    const composedKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val as Record<string, unknown>, composedKey, out);
    } else {
      out[composedKey] = String(val);
    }
  }
  return out;
}

/** First segment of the key, before the first "." or "_" (used to group rows). */
function categoryOf(key: string): string {
  return key.split(/[._]/)[0];
}

async function main() {
  // Load and flatten every locale up front.
  const flat = new Map<Locale, Record<string, string>>();
  for (const locale of LOCALES) {
    const raw = readFileSync(dictionaryPath(locale), 'utf-8');
    flat.set(locale, flatten(JSON.parse(raw) as Record<string, unknown>));
  }

  // Union of all keys across locales, so a key present in only one file still
  // yields rows for both locales (missing side falls back to the key itself).
  const allKeys = new Set<string>();
  for (const dict of flat.values()) {
    Object.keys(dict).forEach((k) => allKeys.add(k));
  }

  let created = 0;
  let existing = 0;

  for (const key of allKeys) {
    const category = categoryOf(key);
    for (const locale of LOCALES) {
      const value = flat.get(locale)?.[key] ?? key;

      // upsert keeps the script idempotent; update is intentionally a no-op so
      // re-running never overwrites published copy or a pending draft.
      const before = await prisma.translation.findUnique({
        where: { key_locale: { key, locale } },
      });

      await prisma.translation.upsert({
        where: { key_locale: { key, locale } },
        update: {},
        create: { key, locale, category, value, draftValue: null },
      });

      before ? existing++ : created++;
    }
  }

  console.log(
    `✅ Translations seeded — ${allKeys.size} keys × ${LOCALES.length} locales: ` +
      `${created} created, ${existing} left untouched.`,
  );
}

main()
  .catch((error) => {
    console.error('❌ Translation seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
