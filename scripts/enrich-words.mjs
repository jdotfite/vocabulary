#!/usr/bin/env node

/**
 * enrich-words.mjs — Enriches words in the DB with difficulty metadata.
 *
 * Computes difficulty_score from available data sources:
 *   - SUBTLEX-US frequency data (data/subtlex-us.csv) — optional
 *   - Kuperman AoA data (data/kuperman-aoa.csv) — optional
 *   - CEFR level mappings (data/cefr-words.csv) — optional
 *   - Tier-based fallback estimates when datasets are unavailable
 *
 * Difficulty formula:
 *   difficulty = 0.35 * freq_factor + 0.30 * aoa_factor
 *                + 0.15 * length_factor + 0.20 * cefr_factor
 *
 * Each factor is normalized 0-1 (higher = harder).
 *
 * Usage:
 *   DATABASE_URL=... node scripts/enrich-words.mjs
 *   DATABASE_URL=... node scripts/enrich-words.mjs --dry-run
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { Pool } from "@neondatabase/serverless";

const ROOT = resolve(import.meta.dirname, "..");
const DATA_DIR = join(ROOT, "data");
const DRY_RUN = process.argv.includes("--dry-run");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL && !DRY_RUN) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tier-based difficulty estimates (fallback when external datasets missing)
// ---------------------------------------------------------------------------

const TIER_DIFFICULTY = {
  kids_beginner: { center: 8, range: 6 },       // 2-14
  kids_intermediate: { center: 20, range: 8 },   // 12-28
  kids_advanced: { center: 35, range: 10 },       // 25-45
  adult_beginner: { center: 48, range: 10 },      // 38-58
  adult_intermediate: { center: 63, range: 10 },  // 53-73
  adult_advanced: { center: 82, range: 12 },      // 70-94
};

const CEFR_SCORE = {
  A1: 0.05, A2: 0.2, B1: 0.4, B2: 0.6, C1: 0.8, C2: 0.95,
};

const TIER_CEFR_MAP = {
  kids_beginner: "A1",
  kids_intermediate: "A1",
  kids_advanced: "A2",
  adult_beginner: "B1",
  adult_intermediate: "B2",
  adult_advanced: "C1",
};

// ---------------------------------------------------------------------------
// CSV loaders (optional datasets)
// ---------------------------------------------------------------------------

function loadCSV(filename, parser) {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) {
    console.log(`  [skip] ${filename} not found in data/ — using fallbacks`);
    return null;
  }
  const raw = readFileSync(path, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(/[,\t]/);
  const data = new Map();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,\t]/);
    const result = parser(header, cols);
    if (result) data.set(result.word.toLowerCase(), result.value);
  }
  console.log(`  [loaded] ${filename}: ${data.size} entries`);
  return data;
}

function loadSubtlexUS() {
  return loadCSV("subtlex-us.csv", (header, cols) => {
    // SUBTLEX-US has columns: Word, FREQcount, CDcount, ..., Lg10WF, Lg10CD, SUBTLWF
    // We want Zipf frequency — approximate from Lg10WF or SUBTLWF
    const wordIdx = header.findIndex((h) => /^word$/i.test(h.trim()));
    const zipfIdx = header.findIndex((h) =>
      /zipf|lg10wf|subtlwf/i.test(h.trim())
    );
    if (wordIdx < 0 || zipfIdx < 0) return null;
    const word = cols[wordIdx]?.trim();
    const value = parseFloat(cols[zipfIdx]?.trim());
    if (!word || isNaN(value)) return null;
    return { word, value };
  });
}

function loadKupermanAoA() {
  return loadCSV("kuperman-aoa.csv", (header, cols) => {
    const wordIdx = header.findIndex((h) => /^word$/i.test(h.trim()));
    const aoaIdx = header.findIndex((h) =>
      /rating\.mean|aoa/i.test(h.trim())
    );
    if (wordIdx < 0 || aoaIdx < 0) return null;
    const word = cols[wordIdx]?.trim();
    const value = parseFloat(cols[aoaIdx]?.trim());
    if (!word || isNaN(value)) return null;
    return { word, value };
  });
}

function loadCEFR() {
  return loadCSV("cefr-words.csv", (header, cols) => {
    const wordIdx = header.findIndex((h) => /^word$/i.test(h.trim()));
    const levelIdx = header.findIndex((h) =>
      /cefr|level/i.test(h.trim())
    );
    if (wordIdx < 0 || levelIdx < 0) return null;
    const word = cols[wordIdx]?.trim();
    const value = cols[levelIdx]?.trim().toUpperCase();
    if (!word || !CEFR_SCORE[value]) return null;
    return { word, value };
  });
}

// ---------------------------------------------------------------------------
// Difficulty computation
// ---------------------------------------------------------------------------

function clamp(min, max, val) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Compute frequency factor (0-1, higher = harder/rarer).
 * Zipf scale: 1 (very rare) to 7 (very common).
 * Invert: higher Zipf = easier = lower factor.
 */
function freqFactor(zipf) {
  if (zipf == null) return null;
  return clamp(0, 1, 1 - (zipf - 1) / 6);
}

/**
 * AoA factor (0-1, higher = harder/later-acquired).
 * AoA range roughly 2 to 16 years.
 */
function aoaFactor(aoa) {
  if (aoa == null) return null;
  return clamp(0, 1, (aoa - 2) / 14);
}

/**
 * Word length factor (0-1, higher = harder/longer).
 * Range 2-15 characters.
 */
function lengthFactor(len) {
  return clamp(0, 1, (len - 2) / 13);
}

/**
 * CEFR factor (0-1, higher = harder).
 */
function cefrFactor(cefrLevel) {
  if (!cefrLevel) return null;
  return CEFR_SCORE[cefrLevel] ?? null;
}

function computeDifficulty(word, tierModeId, subtlex, kuperman, cefr) {
  const wordLower = word.toLowerCase();

  // Get values from external datasets only (not tier-based fallbacks)
  const zipfVal = subtlex?.get(wordLower) ?? null;
  const aoaVal = kuperman?.get(wordLower) ?? null;
  const cefrVal = cefr?.get(wordLower) ?? null; // only real CEFR data

  const freq = freqFactor(zipfVal);
  const aoa = aoaFactor(aoaVal);
  const len = lengthFactor(word.length);
  const cefrF = cefrFactor(cefrVal);

  // Count how many real dataset factors we have (not just length)
  const hasRealData = (freq != null ? 1 : 0) + (aoa != null ? 1 : 0) + (cefrF != null ? 1 : 0);

  // If we have at least one real dataset factor, use weighted formula
  if (hasRealData >= 1) {
    const factors = [];
    const weights = [];

    if (freq != null) { factors.push(freq); weights.push(0.35); }
    if (aoa != null) { factors.push(aoa); weights.push(0.3); }
    factors.push(len); weights.push(0.15);
    if (cefrF != null) { factors.push(cefrF); weights.push(0.2); }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weighted =
      factors.reduce((sum, f, i) => sum + f * weights[i], 0) / totalWeight;
    return clamp(0, 100, weighted * 100);
  }

  // Fallback: tier-based estimate with deterministic per-word jitter
  const tier = TIER_DIFFICULTY[tierModeId];
  if (!tier) return 50;

  // Deterministic hash for spreading words within a tier
  const hash = wordLower
    .split("")
    .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const jitter = ((Math.abs(hash) % 1000) / 1000 - 0.5) * tier.range;
  const lengthBias = (len - 0.5) * tier.range * 0.4;

  return clamp(0, 100, tier.center + jitter + lengthBias);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Loading external datasets...");
  const subtlex = loadSubtlexUS();
  const kuperman = loadKupermanAoA();
  const cefrData = loadCEFR();

  const hasExternalData = !!(subtlex || kuperman || cefrData);
  console.log(
    hasExternalData
      ? "Using available dataset(s) + fallbacks for missing words."
      : "No external datasets found — using tier-based fallback estimates."
  );

  if (DRY_RUN) {
    // In dry-run mode, compute from JSON files instead of DB
    const { readdirSync } = await import("node:fs");
    const modesDir = join(ROOT, "content", "modes");
    const files = readdirSync(modesDir).filter((f) => f.endsWith(".json"));
    const results = [];

    for (const f of files) {
      const mode = JSON.parse(readFileSync(join(modesDir, f), "utf-8"));
      const seen = new Set();
      for (const q of mode.questions) {
        if (seen.has(q.word)) continue;
        seen.add(q.word);
        const score = computeDifficulty(
          q.word,
          mode.modeId,
          subtlex,
          kuperman,
          cefrData
        );
        const cefrLevel =
          cefrData?.get(q.word.toLowerCase()) ??
          TIER_CEFR_MAP[mode.modeId] ??
          null;
        results.push({
          word: q.word,
          tier: mode.modeId,
          score: Math.round(score * 10) / 10,
          cefr: cefrLevel,
        });
      }
    }

    results.sort((a, b) => a.score - b.score);
    console.log("\n--- Difficulty scores (dry run) ---");
    for (const r of results) {
      console.log(
        `  ${r.score.toFixed(1).padStart(5)}  ${r.word.padEnd(20)} ${r.tier.padEnd(22)} ${r.cefr ?? "-"}`
      );
    }

    // Stats per tier
    console.log("\n--- Per-tier summary ---");
    const tiers = {};
    for (const r of results) {
      if (!tiers[r.tier]) tiers[r.tier] = [];
      tiers[r.tier].push(r.score);
    }
    for (const [tier, scores] of Object.entries(tiers)) {
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      console.log(
        `  ${tier.padEnd(22)} count=${scores.length.toString().padStart(3)}  min=${min.toFixed(1).padStart(5)}  max=${max.toFixed(1).padStart(5)}  avg=${avg.toFixed(1).padStart(5)}`
      );
    }
    return;
  }

  // Live mode: update DB
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Fetch all words with their tier mode_id
    const { rows } = await pool.query(`
      SELECT w.id, w.word, dt.mode_id AS tier_mode_id
      FROM words w
      JOIN difficulty_tiers dt ON dt.id = w.tier_id
    `);

    console.log(`\nEnriching ${rows.length} words in database...`);

    let updated = 0;
    for (const row of rows) {
      const score = computeDifficulty(
        row.word,
        row.tier_mode_id,
        subtlex,
        kuperman,
        cefrData
      );
      const cefrLevel =
        cefrData?.get(row.word.toLowerCase()) ??
        TIER_CEFR_MAP[row.tier_mode_id] ??
        null;
      const zipfVal = subtlex?.get(row.word.toLowerCase()) ?? null;
      const aoaVal = kuperman?.get(row.word.toLowerCase()) ?? null;

      await pool.query(
        `UPDATE words SET
          difficulty_score = $1,
          cefr_level = $2,
          frequency_zipf = $3,
          age_of_acquisition = $4,
          word_length = $5
        WHERE id = $6`,
        [
          Math.round(score * 10) / 10,
          cefrLevel,
          zipfVal,
          aoaVal,
          row.word.length,
          row.id,
        ]
      );
      updated++;
    }

    console.log(`Updated ${updated} words with difficulty metadata.`);

    // Verify
    const { rows: stats } = await pool.query(`
      SELECT
        dt.mode_id,
        COUNT(*) as word_count,
        ROUND(MIN(w.difficulty_score)::numeric, 1) as min_diff,
        ROUND(MAX(w.difficulty_score)::numeric, 1) as max_diff,
        ROUND(AVG(w.difficulty_score)::numeric, 1) as avg_diff
      FROM words w
      JOIN difficulty_tiers dt ON dt.id = w.tier_id
      GROUP BY dt.mode_id
      ORDER BY MIN(dt.sort_order)
    `);

    console.log("\n--- Per-tier summary ---");
    for (const s of stats) {
      console.log(
        `  ${s.mode_id.padEnd(22)} count=${s.word_count.toString().padStart(3)}  min=${s.min_diff.toString().padStart(5)}  max=${s.max_diff.toString().padStart(5)}  avg=${s.avg_diff.toString().padStart(5)}`
      );
    }

    // Check for missing difficulty scores
    const { rows: missing } = await pool.query(
      `SELECT COUNT(*) as cnt FROM words WHERE difficulty_score IS NULL`
    );
    if (parseInt(missing[0].cnt) > 0) {
      console.warn(`\nWARNING: ${missing[0].cnt} words still missing difficulty_score!`);
    } else {
      console.log("\nAll words have difficulty_score populated.");
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
