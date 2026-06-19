/*
 * EN: Guard against the deprecated `::ng-deep` (and `/deep/`, `>>>`) shadow-
 *     piercing combinators in stylesheets. ESLint can't lint SCSS, so this
 *     script is the enforcement equivalent: it walks src/ for *.scss / *.css and
 *     fails (non-zero exit) if any piercing combinator is found. Wire it via
 *     `npm run lint:styles` (and CI) to keep third-party overrides in the global
 *     styles.scss instead of piercing encapsulation.
 * RU: Защита от устаревшего `::ng-deep` (и `/deep/`, `>>>`) в стилях. ESLint не
 *     проверяет SCSS, поэтому этот скрипт — эквивалент правила: обходит src/ по
 *     *.scss / *.css и завершается с ошибкой, если найден пробивающий комбинатор.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'projects/neomatten-app/src';
const PATTERN = /::ng-deep|\/deep\/|>>>/;
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (/\.(scss|css)$/.test(entry)) {
      const lines = readFileSync(path, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (PATTERN.test(line)) {
          offenders.push(`${path}:${i + 1}  ${line.trim()}`);
        }
      });
    }
  }
}

walk(ROOT);

if (offenders.length > 0) {
  console.error('✖ Forbidden shadow-piercing combinator (::ng-deep / /deep/ / >>>):\n');
  console.error(offenders.join('\n'));
  console.error(
    '\nMove third-party component overrides to src/styles.scss (global, no encapsulation),\n' +
      'or use ViewEncapsulation.None on a dedicated wrapper component. ::ng-deep is deprecated.'
  );
  process.exit(1);
}

console.log('✓ No ::ng-deep usage found.');
