/**
 * Concatenates the numbered migrations into supabase/RUN_THIS.sql — the single
 * file to paste into the Supabase SQL editor.
 *
 *   node scripts/build-migration.mjs
 *
 * Deliberately Node rather than PowerShell. Windows PowerShell's Get-Content
 * reads files in the ANSI codepage unless told otherwise, which silently turns
 * every "→", "✈️" and "d'Ampezzo" into mojibake; writing that back out as UTF-8
 * bakes the corruption in. Node reads and writes UTF-8 by default, and the
 * assertion at the bottom fails loudly if anything mangles it anyway.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'supabase');

const PARTS = [
  '002_shugon_schema.sql',
  '003_seed_cyprus_dolomites.sql',
  '004_storage.sql'
];

// No header comment, deliberately. The output must contain zero comments —
// see stripComments() below for why. Documentation lives in 002/003/004.
const header = '';

/**
 * Strip every `--` comment, string- and dollar-quote aware.
 *
 * The Supabase SQL editor splits a pasted script into statements with a parser
 * we cannot see, and it demonstrably mishandles comments: a semicolon inside
 * one ends the statement early, and prose like "... from the arrays ..." then
 * gets parsed as SQL, producing `relation "the" does not exist`. Rather than
 * keep guessing which punctuation is safe, the pasted artefact carries no
 * comments at all. The annotated originals stay in 002/003/004 for reading.
 */
function stripComments(sql) {
  let out = '', i = 0, inStr = false, tag = null;
  while (i < sql.length) {
    const ch = sql[i];
    if (tag) {
      if (sql.startsWith(tag, i)) { out += tag; i += tag.length; tag = null; continue; }
      out += ch; i++; continue;
    }
    if (inStr) {
      out += ch;
      if (ch === "'") {
        if (sql[i + 1] === "'") { out += sql[++i]; }
        else inStr = false;
      }
      i++; continue;
    }
    if (ch === "'") { inStr = true; out += ch; i++; continue; }
    const dq = sql.slice(i).match(/^\$[A-Za-z_]*\$/);
    if (dq) { tag = dq[0]; out += dq[0]; i += dq[0].length; continue; }
    if (ch === '-' && sql[i + 1] === '-') {                    // comment to end of line
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl;                          // keep the newline itself
      continue;
    }
    out += ch; i++;
  }
  return out
    .split('\n')
    .map(l => l.replace(/\s+$/, ''))
    .filter((l, idx, arr) => l.trim() !== '' || (idx > 0 && arr[idx - 1].trim() !== ''))
    .join('\n');
}

const body = stripComments(PARTS.map(p => readFileSync(join(dir, p), 'utf8')).join('\n'));
const out = header + body;

// --- guard rails ----------------------------------------------------------
const problems = [];
if (out.charCodeAt(0) === 0xFEFF) problems.push('starts with a BOM');
if (out.includes('â†')) problems.push('contains mojibake (â†) — an arrow was read as ANSI');
if (out.includes('Ã')) problems.push('contains mojibake (Ã) — an accent was read as ANSI');
if (!out.includes('→')) problems.push('lost the → characters entirely');
// Note the doubled quote: inside a SQL string literal the apostrophe is
// escaped, so the file contains d''Ampezzo, not d'Ampezzo.
if (!out.includes("d''Ampezzo")) problems.push("lost Cortina d''Ampezzo");
if (!/create table if not exists public\.trips/.test(out)) problems.push('schema section missing');
if (!/insert into public\.days/.test(out)) problems.push('seed section missing');
if (!/media public read/.test(out)) problems.push('storage section missing');

// Postgres handles comments fine. The Supabase SQL editor splits the script
// into statements itself with a parser that does NOT skip `--` comments, so
// punctuation inside one leaks into the SQL:
//   ;  ends the statement early, and the rest of the comment is parsed as SQL
//      ("...on the activity; the Bookings view..." -> relation "the" does not exist)
//   '  opens a string literal that swallows everything to the next quote
// Both cost a round trip with the user, so both are hard failures now.
const badComments = out
  .split('\n')
  .map((line, n) => ({ line, n: n + 1 }))
  .map(({ line, n }) => {
    const c = line.indexOf('--');
    if (c === -1) return null;
    const before = line.slice(0, c);
    // Ignore a "--" that is itself inside a string literal.
    if ((before.match(/'/g) || []).length % 2 === 1) return null;
    const comment = line.slice(c);
    const chars = [comment.includes(';') && ';', comment.includes("'") && "'"].filter(Boolean);
    return chars.length ? { n, line: line.trim(), chars } : null;
  })
  .filter(Boolean);

if (badComments.length) {
  problems.push(
    'punctuation inside a SQL comment that breaks the Supabase editor:\n' +
    badComments.map(b => `      line ${b.n} [${b.chars.join(' ')}]: ${b.line}`).join('\n')
  );
}

// The strongest guarantee available: if there are no comments at all, no
// comment-parsing quirk in the editor can misread one as SQL.
const leftover = out.split('\n').map((l, n) => ({ l, n: n + 1 })).filter(({ l }) => {
  const c = l.indexOf('--');
  if (c === -1) return false;
  return (l.slice(0, c).match(/'/g) || []).length % 2 === 0;   // not inside a string
});
if (leftover.length) {
  problems.push(
    'comments survived stripping (the pasted file must have none):\n' +
    leftover.slice(0, 5).map(b => `      line ${b.n}: ${b.l.trim()}`).join('\n')
  );
}

if (problems.length) {
  console.error('REFUSING TO WRITE:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

writeFileSync(join(dir, 'RUN_THIS.sql'), out, 'utf8');

const arrows = (out.match(/→/g) || []).length;
console.log('wrote supabase/RUN_THIS.sql');
console.log(`  ${out.split('\n').length} lines, ${(Buffer.byteLength(out, 'utf8') / 1024).toFixed(1)} KB`);
console.log(`  encoding checks passed (${arrows} arrows intact, no BOM, no mojibake)`);
