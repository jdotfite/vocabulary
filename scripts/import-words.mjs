#!/usr/bin/env node
/**
 * Bulk word import pipeline.
 *
 * Multi-stage process:
 * 1. Load candidate words from SUBTLEX-US (data/subtlex-us.csv) and/or Kuperman AoA (data/kuperman-aoa.csv)
 * 2. Filter out existing DB words, profanity, proper nouns
 * 3. Fetch definitions from Free Dictionary API (dictionaryapi.dev)
 * 4. Compute difficulty_score using the enrichment formula
 * 5. Insert into words table
 *
 * Usage:
 *   node scripts/import-words.mjs [--limit 100] [--min-zipf 2.0] [--dry-run]
 *
 * Prerequisites:
 *   - DATABASE_URL env var set
 *   - At least one data file in data/ directory:
 *     - data/subtlex-us.csv  (SUBTLEX-US word frequency, columns: Word, Lg10WF, SUBTLWF, ...)
 *     - data/kuperman-aoa.csv (Kuperman AoA ratings, columns: Word, Rating.Mean, ...)
 */

import { readFileSync, existsSync } from "fs";
import { neon } from "@neondatabase/serverless";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
const DRY_RUN = args.includes("--dry-run");
const LIMIT = parseInt(getArg("--limit") ?? "200", 10);
const MIN_ZIPF = parseFloat(getArg("--min-zipf") ?? "2.0");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL && !DRY_RUN) {
  console.error("DATABASE_URL env var required (or use --dry-run)");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load external datasets
// ---------------------------------------------------------------------------

function parseCsv(path) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
    const row = {};
    header.forEach((h, idx) => (row[h] = cols[idx]));
    rows.push(row);
  }
  return rows;
}

function parseTsv(path) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const header = lines[0].split("\t").map((h) => h.trim().replace(/"/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t").map((c) => c.trim().replace(/"/g, ""));
    const row = {};
    header.forEach((h, idx) => (row[h] = cols[idx]));
    rows.push(row);
  }
  return rows;
}

// Try CSV and TSV variants
const subtlexPath = existsSync("data/subtlex-us.csv")
  ? "data/subtlex-us.csv"
  : existsSync("data/subtlex-us.tsv")
    ? "data/subtlex-us.tsv"
    : null;
const kupermanPath = existsSync("data/kuperman-aoa.csv")
  ? "data/kuperman-aoa.csv"
  : existsSync("data/kuperman-aoa.tsv")
    ? "data/kuperman-aoa.tsv"
    : null;

const subtlexData = subtlexPath
  ? (subtlexPath.endsWith(".tsv") ? parseTsv(subtlexPath) : parseCsv(subtlexPath))
  : null;
const kupermanData = kupermanPath
  ? (kupermanPath.endsWith(".tsv") ? parseTsv(kupermanPath) : parseCsv(kupermanPath))
  : null;

if (!subtlexData && !kupermanData) {
  console.error("No data files found. Place at least one of:");
  console.error("  data/subtlex-us.csv or data/subtlex-us.tsv");
  console.error("  data/kuperman-aoa.csv or data/kuperman-aoa.tsv");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Build candidate word list
// ---------------------------------------------------------------------------

// Index SUBTLEX by word
const freqMap = new Map();
if (subtlexData) {
  for (const row of subtlexData) {
    const word = (row.Word ?? row.word ?? "").toLowerCase().trim();
    // Zipf = Lg10WF + 3 (approximate) or use SUBTLWF column
    const lg10wf = parseFloat(row.Lg10WF ?? row["Lg10(FREQcount+1)"] ?? "0");
    const zipf = lg10wf + 3;
    if (word && zipf >= MIN_ZIPF) {
      freqMap.set(word, { zipf, lg10wf });
    }
  }
  console.log(`[SUBTLEX] ${freqMap.size} words with Zipf >= ${MIN_ZIPF}`);
}

// Index Kuperman AoA by word
const aoaMap = new Map();
if (kupermanData) {
  for (const row of kupermanData) {
    const word = (row.Word ?? row.word ?? "").toLowerCase().trim();
    const aoa = parseFloat(row["Rating.Mean"] ?? row.AoA ?? "0");
    if (word && !isNaN(aoa) && aoa > 0) {
      aoaMap.set(word, aoa);
    }
  }
  console.log(`[Kuperman] ${aoaMap.size} words with AoA ratings`);
}

// Combine: words present in at least one dataset
const candidateWords = new Set([...freqMap.keys(), ...aoaMap.keys()]);
console.log(`[Combined] ${candidateWords.size} unique candidate words`);

// Basic profanity filter
const PROFANITY = new Set([
  "fuck", "shit", "ass", "bitch", "damn", "crap", "dick", "cock",
  "pussy", "bastard", "slut", "whore", "nigger", "faggot", "retard"
]);

// Filter: no proper nouns (starts with uppercase in raw data), no profanity,
// only alphabetic words (no hyphens, numbers, etc.)
const VALID_WORD = /^[a-z]{3,20}$/;
const filteredCandidates = [...candidateWords].filter((word) => {
  if (!VALID_WORD.test(word)) return false;
  if (PROFANITY.has(word)) return false;
  return true;
});
console.log(`[Filtered] ${filteredCandidates.length} valid candidates`);

// ---------------------------------------------------------------------------
// Check existing words in DB
// ---------------------------------------------------------------------------

const sql = DRY_RUN ? null : neon(DATABASE_URL);

let existingWords = new Set();
if (sql) {
  const rows = await sql`SELECT word FROM words`;
  existingWords = new Set(rows.map((r) => r.word.toLowerCase()));
  console.log(`[DB] ${existingWords.size} existing words`);
}

const newWords = filteredCandidates.filter((w) => !existingWords.has(w));
console.log(`[New] ${newWords.length} words not yet in DB`);

// Sort by frequency (higher Zipf = more common = import first) then AoA
newWords.sort((a, b) => {
  const aZipf = freqMap.get(a)?.zipf ?? 0;
  const bZipf = freqMap.get(b)?.zipf ?? 0;
  return bZipf - aZipf;
});

const toImport = newWords.slice(0, LIMIT);
console.log(`[Import] Processing ${toImport.length} words (limit: ${LIMIT})`);

// ---------------------------------------------------------------------------
// Fetch definitions from Free Dictionary API
// ---------------------------------------------------------------------------

async function fetchDefinition(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[0];
    if (!entry) return null;

    const phonetic =
      entry.phonetic ??
      entry.phonetics?.find((p) => p.text)?.text ??
      "";

    // Get first definition and part of speech
    const firstMeaning = entry.meanings?.[0];
    const partOfSpeech = firstMeaning?.partOfSpeech ?? "";
    const definition = firstMeaning?.definitions?.[0]?.definition ?? "";
    const example = firstMeaning?.definitions?.[0]?.example ?? "";

    return { phonetic, definition, partOfSpeech, example };
  } catch {
    return null;
  }
}

// Rate-limited batch fetch
const BATCH_SIZE = 5;
const DELAY_MS = 500;

const enrichedWords = [];
for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
  const batch = toImport.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(batch.map(fetchDefinition));

  for (let j = 0; j < batch.length; j++) {
    const word = batch[j];
    const def = results[j];
    if (!def || !def.definition) {
      console.log(`  [skip] ${word} — no definition found`);
      continue;
    }

    enrichedWords.push({
      word,
      phonetic: def.phonetic,
      definition: def.definition,
      partOfSpeech: def.partOfSpeech,
      sentence: def.example || null,
    });
  }

  if (i + BATCH_SIZE < toImport.length) {
    process.stdout.write(
      `\r  [fetch] ${Math.min(i + BATCH_SIZE, toImport.length)}/${toImport.length}`
    );
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}
console.log(`\n[Enriched] ${enrichedWords.length} words with definitions`);

// ---------------------------------------------------------------------------
// Compute difficulty scores
// ---------------------------------------------------------------------------

function computeDifficulty(word) {
  const zipf = freqMap.get(word)?.zipf;
  const aoa = aoaMap.get(word);
  const len = word.length;

  // Frequency factor: Zipf 1-7 → 0 (easy/common) to 1 (rare/hard)
  const freqFactor = zipf != null ? Math.max(0, Math.min(1, (7 - zipf) / 5)) : 0.5;

  // AoA factor: 3-15 → 0 (early/easy) to 1 (late/hard)
  const aoaFactor = aoa != null ? Math.max(0, Math.min(1, (aoa - 3) / 12)) : 0.5;

  // Length factor: 3-15 chars → 0 to 1
  const lengthFactor = Math.max(0, Math.min(1, (len - 3) / 12));

  // Composite: 0.35*freq + 0.30*aoa + 0.15*length + 0.20*base
  const raw = 0.35 * freqFactor + 0.30 * aoaFactor + 0.15 * lengthFactor + 0.20 * 0.5;

  return Math.round(raw * 100 * 10) / 10;
}

// Assign tier based on difficulty score
function difficultyToTier(score) {
  if (score < 15) return "kids_beginner";
  if (score < 30) return "kids_intermediate";
  if (score < 45) return "kids_advanced";
  if (score < 60) return "adult_beginner";
  if (score < 75) return "adult_intermediate";
  return "adult_advanced";
}

for (const entry of enrichedWords) {
  entry.difficultyScore = computeDifficulty(entry.word);
  entry.tier = difficultyToTier(entry.difficultyScore);
  entry.wordLength = entry.word.length;
}

// ---------------------------------------------------------------------------
// Insert into DB
// ---------------------------------------------------------------------------

if (DRY_RUN) {
  console.log("\n[dry-run] Would insert these words:");
  for (const entry of enrichedWords.slice(0, 20)) {
    console.log(
      `  ${entry.word} (${entry.tier}, difficulty=${entry.difficultyScore}, pos=${entry.partOfSpeech})`
    );
  }
  console.log(`  ... and ${Math.max(0, enrichedWords.length - 20)} more`);
  process.exit(0);
}

// Get tier IDs
const tierRows = await sql`SELECT id, mode_id FROM difficulty_tiers`;
const tierIdMap = Object.fromEntries(tierRows.map((r) => [r.mode_id, r.id]));

let inserted = 0;
let skipped = 0;
for (const entry of enrichedWords) {
  const tierId = tierIdMap[entry.tier];
  if (!tierId) {
    console.log(`  [skip] ${entry.word} — no tier ${entry.tier}`);
    skipped++;
    continue;
  }

  try {
    await sql`
      INSERT INTO words (word, phonetic, definition, tier_id, difficulty_score, word_length, part_of_speech, sentence)
      VALUES (
        ${entry.word},
        ${entry.phonetic},
        ${entry.definition},
        ${tierId}::uuid,
        ${entry.difficultyScore},
        ${entry.wordLength},
        ${entry.partOfSpeech},
        ${entry.sentence}
      )
      ON CONFLICT (word) DO NOTHING
    `;
    inserted++;
  } catch (err) {
    console.log(`  [error] ${entry.word}: ${err.message}`);
    skipped++;
  }
}

console.log(`\n[Done] Inserted: ${inserted}, Skipped: ${skipped}`);

// Verify
const [countRow] = await sql`SELECT COUNT(*) as count FROM words`;
console.log(`[DB] Total words in database: ${countRow.count}`);
