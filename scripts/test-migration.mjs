/**
 * Runs supabase/RUN_THIS.sql against a local Postgres, EACH STATEMENT IN ITS
 * OWN SESSION.
 *
 * Why that matters: psql -f keeps a single session for the whole file, so
 * session-scoped things (temp tables, SET LOCAL, an open transaction) appear
 * to work. The Supabase SQL editor gives no such guarantee, and a migration
 * that leans on session state fails there with errors like
 *   relation "_trip" does not exist
 * having passed locally. This harness is deliberately harsher than psql so
 * that class of bug cannot reach the user again.
 *
 *   node scripts/test-migration.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PSQL = 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
const PORT = '55432';
const DB = 'shugon_stmt_test';
const scratch = join(root, '.tmp-migration-test');

/**
 * Split SQL into top-level statements. Aware of single-quoted strings and
 * dollar-quoted blocks ($$ ... $$), so the DO block in the schema and any
 * semicolon inside a note stay in one piece.
 */
function splitStatements(sql) {
  const out = [];
  let buf = '', i = 0, inStr = false, dollarTag = null;
  while (i < sql.length) {
    const ch = sql[i];
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) { buf += dollarTag; i += dollarTag.length; dollarTag = null; continue; }
      buf += ch; i++; continue;
    }
    if (inStr) {
      buf += ch;
      if (ch === "'") inStr = sql[i + 1] === "'" ? (buf += sql[++i], true) : false;
      i++; continue;
    }
    if (ch === "'") { inStr = true; buf += ch; i++; continue; }
    const dq = sql.slice(i).match(/^\$[A-Za-z_]*\$/);
    if (dq) { dollarTag = dq[0]; buf += dollarTag; i += dollarTag.length; continue; }
    if (ch === '-' && sql[i + 1] === '-') {                       // line comment
      const nl = sql.indexOf('\n', i);
      buf += nl === -1 ? sql.slice(i) : sql.slice(i, nl + 1);
      i = nl === -1 ? sql.length : nl + 1;
      continue;
    }
    if (ch === ';') { out.push(buf.trim()); buf = ''; i++; continue; }
    buf += ch; i++;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(s => s.replace(/--[^\n]*\n?/g, '').trim().length > 0);
}

function psql(args, opts = {}) {
  return execFileSync(PSQL, ['-h', '127.0.0.1', '-p', PORT, '-U', 'postgres', '--no-psqlrc', ...args], {
    encoding: 'utf8', env: { ...process.env, PGCLIENTENCODING: 'UTF8' }, ...opts
  });
}

// --- fresh database --------------------------------------------------------
psql(['-c', `drop database if exists ${DB};`, '-q']);
psql(['-c', `create database ${DB} encoding 'UTF8' template template0;`, '-q']);
psql(['-d', DB, '-v', 'ON_ERROR_STOP=1', '-f', join(root, 'scripts', 'supabase-stub.sql'), '-q']);

// --- one statement, one session -------------------------------------------
if (existsSync(scratch)) rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

const sql = readFileSync(join(root, 'supabase', 'RUN_THIS.sql'), 'utf8');
const statements = splitStatements(sql);
console.log(`${statements.length} statements — running each in a separate session`);

let failed = 0;
statements.forEach((stmt, idx) => {
  const f = join(scratch, String(idx).padStart(4, '0') + '.sql');
  writeFileSync(f, stmt + ';\n', 'utf8');
  try {
    psql(['-d', DB, '-v', 'ON_ERROR_STOP=1', '-f', f, '-q'], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    failed++;
    if (failed <= 3) {
      const first = (e.stderr || '').split('\n').find(l => /ERROR|FATAL/.test(l)) || String(e.message).slice(0, 160);
      console.error(`\n  STATEMENT ${idx} FAILED: ${first.trim()}`);
      console.error(`    ${stmt.split('\n').slice(0, 3).join('\n    ').slice(0, 240)}`);
    }
  }
});

if (failed) {
  console.error(`\n${failed} statement(s) failed — NOT safe to hand over.`);
  rmSync(scratch, { recursive: true, force: true });
  process.exit(1);
}

// --- verify what landed ----------------------------------------------------
const one = q => psql(['-d', DB, '-t', '-A', '-c', q]).trim();
const checks = {
  trips: 'select count(*) from trips',
  days: 'select count(*) from days',
  activities: 'select count(*) from activities',
  unscheduled: 'select count(*) from activities where day_id is null',
  budget: 'select count(*) from budget_items',
  packing: 'select count(*) from packing_items',
  people: 'select count(*) from people',
  outstanding: 'select count(*) from outstanding_bookings',
  buckets: 'select count(*) from storage.buckets'
};
const expected = { trips: 1, days: 24, activities: 37, unscheduled: 13, budget: 11, packing: 21, people: 3, outstanding: 13, buckets: 2 };

let bad = 0;
for (const [name, q] of Object.entries(checks)) {
  const got = Number(one(q));
  const want = expected[name];
  const ok = got === want;
  if (!ok) bad++;
  console.log(`  ${ok ? 'ok  ' : 'BAD '} ${name.padEnd(12)} ${got}${ok ? '' : ` (expected ${want})`}`);
}

// text integrity — the mojibake check
const arrow = one(`select (title like '%' || chr(8594) || '%')::text from days where date='2026-09-17'`);
const emoji = one(`select (title like '%' || chr(9992) || '%')::text from days where date='2026-09-17'`);
const apost = one(`select count(*) from days where base_location = 'Cortina d''Ampezzo'`);
console.log(`  ${arrow === 'true' ? 'ok  ' : 'BAD '} arrow →      ${arrow}`);
console.log(`  ${emoji === 'true' ? 'ok  ' : 'BAD '} emoji ✈       ${emoji}`);
console.log(`  ${apost === '4' ? 'ok  ' : 'BAD '} apostrophe   ${apost} days`);
if (arrow !== 'true' || emoji !== 'true' || apost !== '4') bad++;

rmSync(scratch, { recursive: true, force: true });

if (bad) { console.error(`\n${bad} check(s) failed.`); process.exit(1); }
console.log('\nALL CHECKS PASSED — every statement stands alone and the data is intact.');
