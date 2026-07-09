#!/usr/bin/env node
// Parse source.txt into data.json with structured card records.

const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'source.txt'), 'utf8');
const lines = raw.split('\n');

const SECTION_RE = /^===\s+(.+?)\s+\((\d+)\s+cards?\)\s+===\s*$/;
const CARD_RE = /^(★\s+|\s{2,})(.+?)\s+[—–-]\s+(.+?):\s+(.+)$/;

const cards = [];
let era = null;

for (const line of lines) {
  const secMatch = line.match(SECTION_RE);
  if (secMatch) {
    era = secMatch[1].trim();
    continue;
  }
  const m = line.match(CARD_RE);
  if (!m || !era) continue;

  const hasQuiz = m[1].trim().startsWith('★');
  const yearRaw = m[2].trim();
  const title = m[3].trim();
  const description = m[4].trim();

  cards.push({
    era,
    year: yearRaw,
    yearSort: parseYear(yearRaw),
    title,
    description,
    hasQuiz,
  });
}

function parseYear(y) {
  // Extract the first 3-4 digit number for sorting; keep negative for BCE-ish placeholders.
  const cleaned = y.replace(/^c\.\s*/i, '').trim();
  const dashMatch = cleaned.match(/(\d{3,4})\s*[–—-]\s*(\d{3,4})/);
  if (dashMatch) return parseInt(dashMatch[1], 10);
  const single = cleaned.match(/(\d{3,4})/);
  if (single) return parseInt(single[1], 10);
  // Non-numeric markers: give an ordering hint by keyword.
  const lower = cleaned.toLowerCase();
  if (lower.includes('ice age')) return -12000;
  if (lower.includes('ancient')) return -8000;
  if (lower.includes('millennia')) return -5000;
  if (lower.includes('pre-1492')) return 1400;
  if (lower.includes('over')) return -5000;
  if (lower.includes('today')) return 2026;
  return 0;
}

const eras = [];
const seen = new Set();
for (const c of cards) {
  if (!seen.has(c.era)) {
    seen.add(c.era);
    eras.push(c.era);
  }
}

const out = { eras, cards };
fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(out, null, 2));
console.log(`Parsed ${cards.length} cards across ${eras.length} eras.`);
console.log(`Quizzable (★) cards: ${cards.filter(c => c.hasQuiz).length}`);
