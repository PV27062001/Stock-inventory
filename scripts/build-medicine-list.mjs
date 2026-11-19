// Builds public/medicines/*.json, the name suggestions on the add screen, from the CSV in
// https://github.com/junioralive/Indian-Medicine-Dataset (MIT, see public/medicines/LICENSE.txt).
// Files are split by the first two letters so a phone only downloads the slice being typed.
//
// Usage: node scripts/build-medicine-list.mjs path/to/indian_medicine_data.csv
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public/medicines';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const tidy = (text = '') => text.replace(/\s+/g, ' ').trim();

const [header, ...rows] = parseCsv(readFileSync(process.argv[2], 'utf8'));
const column = (name) => header.indexOf(name);
const [nameAt, stoppedAt, firstAt, secondAt] = ['name', 'Is_discontinued', 'short_composition1', 'short_composition2'].map(column);

const seen = new Set();
const chunks = new Map();
for (const row of rows) {
  const name = tidy(row[nameAt]);
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 2);
  if (key.length < 2 || row[stoppedAt]?.toUpperCase() === 'TRUE' || seen.has(name.toLowerCase())) continue;
  seen.add(name.toLowerCase());
  const composition = [tidy(row[firstAt]), tidy(row[secondAt])].filter(Boolean).join(' + ');
  if (!chunks.has(key)) chunks.set(key, []);
  chunks.get(key).push([name, composition]);
}

const license = readFileSync(join(OUT, 'LICENSE.txt'));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'LICENSE.txt'), license);
for (const [key, entries] of chunks) {
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  writeFileSync(join(OUT, `${key}.json`), JSON.stringify(entries));
}
console.log(`${seen.size} medicines in ${chunks.size} files`);
