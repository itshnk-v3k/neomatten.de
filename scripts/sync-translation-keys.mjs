#!/usr/bin/env node
/*
 * sync-translation-keys.mjs
 *
 * Applies backend translation-key renames to the Angular codebase.
 *
 * It fetches the { oldKey, newKey } mapping from the admin API
 * (GET /api/admin/translations/renamed) and rewrites every occurrence of an
 * oldKey string literal that appears inside a RECOGNISED translation-call
 * context — never a blind global string replace.
 *
 * Recognised contexts (see PATTERNS below): the `| translate` pipe, a
 * `.translate('key'…)` service/method call, and a `*Key: 'key'` property
 * assignment (route data / nav config / view-model keys). Matches are anchored
 * to the EXACT oldKey string, so `'foo'` never matches inside `'foobar'`.
 *
 * Default mode is a dry run (report only). Pass --apply to write changes.
 * The script never runs git.
 *
 *   node scripts/sync-translation-keys.mjs                  # dry run
 *   node scripts/sync-translation-keys.mjs --apply          # write changes
 *   node scripts/sync-translation-keys.mjs --token <jwt>
 *   node scripts/sync-translation-keys.mjs --email a@b.de --password secret
 *
 * Auth (first match wins):
 *   --token <jwt> | env TRANSLATIONS_ADMIN_TOKEN
 *   --email/--password | env ADMIN_EMAIL/ADMIN_PASSWORD  (logs in for a token)
 *   otherwise: interactive prompt (email + hidden password)
 *
 * API base:  --api <url> | env TRANSLATIONS_API  (default http://localhost:5000)
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import process from 'node:process';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN_ROOTS = ['projects/neomatten-app/src', 'projects/neomatten-admin/src'];
const SCAN_EXTENSIONS = new Set(['.ts', '.html']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.angular', '.git']);

// ── CLI args ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { apply: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--dry-run') args.apply = false;
    else if (a === '--token') args.token = argv[++i];
    else if (a === '--api') args.api = argv[++i];
    else if (a === '--email') args.email = argv[++i];
    else if (a === '--password') args.password = argv[++i];
    else if (a.startsWith('--token=')) args.token = a.slice(8);
    else if (a.startsWith('--api=')) args.api = a.slice(6);
    else if (a.startsWith('--email=')) args.email = a.slice(8);
    else if (a.startsWith('--password=')) args.password = a.slice(11);
  }
  return args;
}

// ── Auth ────────────────────────────────────────────────────────────────────
function prompt(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  return new Promise(resolve => {
    if (hidden) {
      // Mute echoed characters for password entry.
      const orig = rl._writeToOutput?.bind(rl);
      rl._writeToOutput = str => {
        if (str.includes('\n') || str.includes('\r')) orig?.(str);
      };
      process.stdout.write(question);
      rl.question('', answer => {
        rl._writeToOutput = orig;
        process.stdout.write('\n');
        rl.close();
        resolve(answer);
      });
    } else {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function resolveToken(args, api) {
  const token = args.token ?? process.env.TRANSLATIONS_ADMIN_TOKEN;
  if (token) return token;

  let email = args.email ?? process.env.ADMIN_EMAIL;
  let password = args.password ?? process.env.ADMIN_PASSWORD;
  if (!email) email = await prompt('Admin email: ');
  if (!password) password = await prompt('Admin password: ', { hidden: true });

  const res = await fetch(`${api}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed (HTTP ${res.status}). Check credentials / API base.`);
  }
  const body = await res.json();
  if (!body.accessToken) throw new Error('Login response had no accessToken.');
  return body.accessToken;
}

async function fetchRenames(api, token) {
  const res = await fetch(`${api}/api/admin/translations/renamed`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Could not fetch renames (HTTP ${res.status}).`);
  }
  const pairs = await res.json();
  // Keep only well-formed, actually-changed pairs.
  return pairs.filter(
    p => p && typeof p.oldKey === 'string' && typeof p.newKey === 'string' && p.oldKey !== p.newKey
  );
}

// ── File scanning ─────────────────────────────────────────────────────────────
async function collectFiles(dir, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.') {
      if (IGNORE_DIRS.has(entry.name)) continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      await collectFiles(full, out);
    } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

// ── Matching ──────────────────────────────────────────────────────────────────
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds the recognised-context matchers for one oldKey. Each matcher wraps the
 * quoted oldKey literal in a specific translation context; only the literal is
 * rewritten (the surrounding context is preserved via capture groups).
 *
 * PATTERNS (Q = one of ' " `):
 *   1. pipe:       QkeyQ  |  translate        →  'k' | translate  /  "k" | translate
 *   2. call:       .translate( QkeyQ          →  this.x.translate('k'[, …])
 *   3. keyed prop: <word>Key: QkeyQ           →  labelKey: 'k'  titleKey: "k"
 */
function buildMatchers(oldKey, newKey) {
  const k = escapeRe(oldKey);
  return [
    {
      pattern: 'pipe',
      re: new RegExp(`(['"\`])${k}\\1(\\s*\\|\\s*translate\\b)`, 'g'),
      replace: (_m, q, rest) => `${q}${newKey}${q}${rest}`,
    },
    {
      pattern: 'call',
      re: new RegExp(`(\\.translate\\(\\s*)(['"\`])${k}\\2`, 'g'),
      replace: (_m, head, q) => `${head}${q}${newKey}${q}`,
    },
    {
      pattern: 'keyed-prop',
      re: new RegExp(`(\\b\\w*[Kk]ey\\s*:\\s*)(['"\`])${k}\\2`, 'g'),
      replace: (_m, head, q) => `${head}${q}${newKey}${q}`,
    },
  ];
}

/**
 * Applies every matcher to a single line for every rename pair. Returns the
 * (possibly) rewritten line and a list of change records for reporting.
 */
function processLine(line, renames) {
  const changes = [];
  let out = line;
  for (const { oldKey, newKey } of renames) {
    for (const matcher of buildMatchers(oldKey, newKey)) {
      out = out.replace(matcher.re, (...groups) => {
        changes.push({ oldKey, newKey, pattern: matcher.pattern });
        return matcher.replace(...groups);
      });
    }
  }
  return { out, changes };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const api = (args.api ?? process.env.TRANSLATIONS_API ?? 'http://localhost:5000').replace(
    /\/$/,
    ''
  );
  const apply = args.apply;

  console.log(`\n🔤  sync-translation-keys  (${apply ? 'APPLY' : 'DRY RUN'})  api=${api}\n`);

  let token;
  try {
    token = await resolveToken(args, api);
  } catch (err) {
    console.error(`❌  ${err.message}`);
    process.exit(1);
  }

  let renames;
  try {
    renames = await fetchRenames(api, token);
  } catch (err) {
    console.error(`❌  ${err.message}`);
    process.exit(1);
  }

  if (renames.length === 0) {
    console.log('✅  No renamed keys returned by the API — nothing to sync.\n');
    return;
  }

  console.log(`Found ${renames.length} renamed key${renames.length === 1 ? '' : 's'}:`);
  for (const { oldKey, newKey } of renames) console.log(`   • ${oldKey}  →  ${newKey}`);
  console.log('');

  const files = [];
  for (const rel of SCAN_ROOTS) await collectFiles(join(ROOT, rel), files);

  let totalChanges = 0;
  const changedFiles = [];

  for (const file of files) {
    const original = await readFile(file, 'utf8');
    const lines = original.split('\n');
    let fileChanged = false;
    const fileEntries = [];

    for (let i = 0; i < lines.length; i++) {
      const { out, changes } = processLine(lines[i], renames);
      if (changes.length > 0) {
        lines[i] = out;
        fileChanged = true;
        for (const c of changes) {
          fileEntries.push({ line: i + 1, snippet: out.trim(), ...c });
          totalChanges++;
        }
      }
    }

    if (fileChanged) {
      const relPath = relative(ROOT, file);
      changedFiles.push(relPath);
      for (const e of fileEntries) {
        console.log(`  ${relPath}:${e.line}  [${e.pattern}]  ${e.oldKey} → ${e.newKey}`);
        console.log(`      ${e.snippet}`);
      }
      if (apply) await writeFile(file, lines.join('\n'), 'utf8');
    }
  }

  console.log('');
  console.log(
    `${apply ? '✍️  Applied' : '🔍  Would apply'} ${totalChanges} change${totalChanges === 1 ? '' : 's'} ` +
      `across ${changedFiles.length} file${changedFiles.length === 1 ? '' : 's'} ` +
      `(scanned ${files.length} files).`
  );

  if (apply && totalChanges > 0) {
    console.log(
      '\n⚠️  Review the changes:  git diff   —   then run the lint/build/tests before committing.' +
        '\n    This script does NOT run git. The old keys stay aliased on the API until you re-verify.'
    );
  } else if (!apply && totalChanges > 0) {
    console.log('\n   Re-run with --apply to write these changes.');
  }
  console.log('');
}

main().catch(err => {
  console.error(`❌  ${err?.stack ?? err}`);
  process.exit(1);
});
