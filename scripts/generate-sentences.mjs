#!/usr/bin/env node
/**
 * Generate example sentences for words missing them.
 *
 * Uses OpenAI-compatible API (or any provider) to batch-generate sentences.
 * Requires OPENAI_API_KEY (or compatible) env var.
 *
 * Usage:
 *   node scripts/generate-sentences.mjs [--limit 50] [--dry-run]
 *
 * Prerequisites:
 *   - DATABASE_URL env var set
 *   - OPENAI_API_KEY env var set (or ANTHROPIC_API_KEY for Claude)
 */

import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
const DRY_RUN = args.includes("--dry-run");
const LIMIT = parseInt(getArg("--limit") ?? "50", 10);

const DATABASE_URL = process.env.DATABASE_URL;
const API_KEY = process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY;

if (!DATABASE_URL) {
  console.error("DATABASE_URL env var required");
  process.exit(1);
}
if (!API_KEY && !DRY_RUN) {
  console.error("OPENAI_API_KEY or ANTHROPIC_API_KEY env var required (or use --dry-run)");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ---------------------------------------------------------------------------
// Find words missing sentences
// ---------------------------------------------------------------------------

const missingRows = await sql`
  SELECT id, word, definition, part_of_speech
  FROM words
  WHERE sentence IS NULL OR sentence = ''
  ORDER BY difficulty_score ASC NULLS LAST
  LIMIT ${LIMIT}
`;

console.log(`[DB] Found ${missingRows.length} words without sentences`);

if (missingRows.length === 0) {
  console.log("[Done] All words have sentences.");
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\n[dry-run] Would generate sentences for:");
  for (const row of missingRows.slice(0, 20)) {
    console.log(`  ${row.word} (${row.part_of_speech ?? "unknown"}): ${row.definition}`);
  }
  if (missingRows.length > 20) {
    console.log(`  ... and ${missingRows.length - 20} more`);
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Generate sentences via AI API
// ---------------------------------------------------------------------------

const BATCH_SIZE = 10;
let generated = 0;

for (let i = 0; i < missingRows.length; i += BATCH_SIZE) {
  const batch = missingRows.slice(i, i + BATCH_SIZE);

  const wordList = batch
    .map((w) => `- "${w.word}" (${w.part_of_speech ?? "word"}): ${w.definition}`)
    .join("\n");

  const prompt = `Generate one natural English example sentence for each word below. Each sentence should clearly demonstrate the word's meaning in context. Return ONLY a JSON array of objects with "word" and "sentence" keys.\n\nWords:\n${wordList}`;

  try {
    // Try OpenAI-compatible API
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[API error] ${res.status}: ${errText}`);
      continue;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const sentences = JSON.parse(jsonStr);

    for (const item of sentences) {
      const word = item.word?.toLowerCase();
      const sentence = item.sentence;
      if (!word || !sentence) continue;

      const dbRow = batch.find((r) => r.word.toLowerCase() === word);
      if (!dbRow) continue;

      // Create gap_sentence by replacing the word with ___
      const gapSentence = sentence.replace(
        new RegExp(`\\b${word}\\b`, "gi"),
        "___"
      );

      await sql`
        UPDATE words
        SET sentence = ${sentence},
            gap_sentence = ${gapSentence}
        WHERE id = ${dbRow.id}::uuid
      `;
      generated++;
    }

    process.stdout.write(
      `\r  [generate] ${Math.min(i + BATCH_SIZE, missingRows.length)}/${missingRows.length}`
    );
  } catch (err) {
    console.error(`\n[batch error] ${err.message}`);
  }

  // Rate limit
  if (i + BATCH_SIZE < missingRows.length) {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log(`\n[Done] Generated sentences for ${generated} words`);

// Verify remaining
const [remaining] = await sql`
  SELECT COUNT(*) as count FROM words WHERE sentence IS NULL OR sentence = ''
`;
console.log(`[DB] Words still missing sentences: ${remaining.count}`);
