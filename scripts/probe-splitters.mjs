/**
 * Diagnostic: try several plausible statement-splitter behaviours against
 * RUN_THIS.sql and report which one yields a fragment beginning with a bare
 * word — the signature of the `relation "the" does not exist` failure.
 *
 * Point is to stop guessing at what the Supabase editor does and instead find
 * which specific parser quirk reproduces the reported error.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(root, 'supabase', 'RUN_THIS.sql'), 'utf8');

function split(sql, { comments, escapedQuotes, dollar }) {
  const out = [];
  let buf = '', i = 0, inStr = false, tag = null;
  while (i < sql.length) {
    const ch = sql[i];
    if (tag) {
      if (sql.startsWith(tag, i)) { buf += tag; i += tag.length; tag = null; continue; }
      buf += ch; i++; continue;
    }
    if (inStr) {
      buf += ch;
      if (ch === "'") {
        if (escapedQuotes && sql[i + 1] === "'") { buf += sql[++i]; }
        else inStr = false;
      }
      i++; continue;
    }
    if (ch === "'") { inStr = true; buf += ch; i++; continue; }
    if (dollar) {
      const dq = sql.slice(i).match(/^\$[A-Za-z_]*\$/);
      if (dq) { tag = dq[0]; buf += dq[0]; i += dq[0].length; continue; }
    }
    if (comments && ch === '-' && sql[i + 1] === '-') {
      const nl = sql.indexOf('\n', i);
      buf += nl === -1 ? sql.slice(i) : sql.slice(i, nl + 1);
      i = nl === -1 ? sql.length : nl + 1;
      continue;
    }
    if (ch === ';') { out.push(buf.trim()); buf = ''; i++; continue; }
    buf += ch; i++;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(s => s.replace(/--[^\n]*\n?/g, '').trim().length);
}

const variants = [
  ['correct   (comments + escaped quotes + $$)', { comments: true,  escapedQuotes: true,  dollar: true  }],
  ['no comment handling',                        { comments: false, escapedQuotes: true,  dollar: true  }],
  ['no escaped-quote handling',                  { comments: true,  escapedQuotes: false, dollar: true  }],
  ['neither comments nor escaped quotes',        { comments: false, escapedQuotes: false, dollar: true  }],
  ['no dollar-quote handling',                   { comments: true,  escapedQuotes: true,  dollar: false }]
];

const KEYWORDS = /^(select|insert|update|delete|create|drop|alter|grant|revoke|do|with|begin|commit|comment|set|truncate)\b/i;

for (const [name, opts] of variants) {
  const parts = split(sql, opts);
  const bad = parts
    .map((p, i) => ({ i, p: p.replace(/^(--[^\n]*\n)+/, '').trim() }))
    .filter(({ p }) => p && !KEYWORDS.test(p));
  const firstWords = bad.slice(0, 3).map(b => JSON.stringify(b.p.split(/\s+/).slice(0, 6).join(' ')));
  console.log(`${name.padEnd(44)} ${String(parts.length).padStart(4)} stmts  ${bad.length ? `${bad.length} NOT starting with SQL keyword -> ${firstWords.join(', ')}` : 'all start with a SQL keyword'}`);
}
