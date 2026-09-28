// Kérdésbank-ellenőrzés: node scripts/check-data.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const FAJLOK = ['terkep', 'radio', 'elsosegely', 'fegyver', 'abv', 'alaki'];
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of FAJLOK) vm.runInContext(readFileSync(new URL(`../data/${f}.js`, import.meta.url), 'utf8'), ctx, { filename: `${f}.js` });

const kerdesek = ctx.window.KERDESEK;
const hibak = [];
const kerdesSzovegek = new Map();
const darab = {};

kerdesek.forEach((k, i) => {
  const hol = `#${i} [${k.t}] „${String(k.q).slice(0, 50)}…”`;
  if (!FAJLOK.includes(k.t)) hibak.push(`${hol}: ismeretlen téma: ${k.t}`);
  if (typeof k.q !== 'string' || k.q.length < 8) hibak.push(`${hol}: hiányzó/rövid kérdés`);
  if (!Array.isArray(k.o) || k.o.length !== 4) hibak.push(`${hol}: pontosan 4 válaszlehetőség kell`);
  else {
    if (k.o.some((o) => typeof o !== 'string' || !o.trim())) hibak.push(`${hol}: üres válaszlehetőség`);
    if (new Set(k.o.map((o) => o.trim().toLowerCase())).size !== 4) hibak.push(`${hol}: ismétlődő válaszlehetőség`);
  }
  if (typeof k.m !== 'string' || k.m.length < 5) hibak.push(`${hol}: hiányzó magyarázat`);
  if (!Number.isInteger(k.p) || k.p < 10 || k.p > 560) hibak.push(`${hol}: hibás oldalszám: ${k.p}`);
  const kulcs = String(k.q).trim().toLowerCase();
  if (kerdesSzovegek.has(kulcs)) hibak.push(`${hol}: duplikált kérdés (#${kerdesSzovegek.get(kulcs)})`);
  kerdesSzovegek.set(kulcs, i);
  darab[k.t] = (darab[k.t] || 0) + 1;
});

console.log('Kérdések témánként:', darab, '– összesen:', kerdesek.length);
if (hibak.length) {
  console.error(`\n${hibak.length} hiba:\n` + hibak.join('\n'));
  process.exit(1);
}
console.log('OK – nincs hiba.');
