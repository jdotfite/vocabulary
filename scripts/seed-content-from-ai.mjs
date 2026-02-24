#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const defaultOutDir = path.join(rootDir, "content", "modes");
const wordBankPath = path.join(rootDir, "content", "seed-word-banks.json");

const QUESTION_TYPES = ["guess_word", "meaning_match", "fill_gap"];

const MODE_CONFIGS = [
  {
    id: "kids_beginner",
    displayName: "Kids Beginner",
    audience: "kids",
    tier: "beginner",
    gradeBand: "K-1",
    minWordLength: 3,
    maxWordLength: 3
  },
  {
    id: "kids_intermediate",
    displayName: "Kids Intermediate",
    audience: "kids",
    tier: "intermediate",
    gradeBand: "2-3",
    minWordLength: 4,
    maxWordLength: 5
  },
  {
    id: "kids_advanced",
    displayName: "Kids Advanced",
    audience: "kids",
    tier: "advanced",
    gradeBand: "4-5",
    minWordLength: 5,
    maxWordLength: 7
  },
  {
    id: "adult_beginner",
    displayName: "Adult Beginner",
    audience: "adult",
    tier: "beginner",
    gradeBand: "Adult",
    minWordLength: 6,
    maxWordLength: 8
  },
  {
    id: "adult_intermediate",
    displayName: "Adult Intermediate",
    audience: "adult",
    tier: "intermediate",
    gradeBand: "Adult",
    minWordLength: 7,
    maxWordLength: 9
  },
  {
    id: "adult_advanced",
    displayName: "Adult Advanced",
    audience: "adult",
    tier: "advanced",
    gradeBand: "Adult",
    minWordLength: 8,
    maxWordLength: 12
  }
];

function parseArgs(argv) {
  const args = {
    useAi: false,
    dryRun: false,
    modeFilter: null,
    outDir: defaultOutDir,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini"
  };

  for (const arg of argv) {
    if (arg === "--ai") args.useAi = true;
    if (arg === "--dry-run") args.dryRun = true;
    if (arg.startsWith("--only=")) {
      args.modeFilter = arg
        .slice("--only=".length)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    if (arg.startsWith("--out-dir=")) {
      const out = arg.slice("--out-dir=".length);
      args.outDir = path.isAbsolute(out) ? out : path.join(rootDir, out);
    }
    if (arg.startsWith("--model=")) {
      args.model = arg.slice("--model=".length).trim();
    }
  }

  return args;
}

function normalizeWord(word) {
  return String(word || "")
    .trim()
    .toLowerCase();
}

function lettersOnly(word) {
  return normalizeWord(word).replace(/[^a-z]/g, "");
}

function containsWholeWord(sentence, word) {
  const escaped = normalizeWord(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return false;
  const re = new RegExp(`\\b${escaped}\\b`, "i");
  return re.test(sentence);
}

function toSentenceCase(text) {
  const value = String(text || "").trim();
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function maskWordInSentence(sentence, word) {
  const safeSentence = String(sentence || "").trim();
  const safeWord = normalizeWord(word);
  const blank = "_".repeat(Math.max(safeWord.length, 3));
  if (!safeSentence || !safeWord) return `The ${blank} is important.`;
  const escaped = safeWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\b`, "i");
  if (re.test(safeSentence)) return safeSentence.replace(re, blank);
  return `The ${blank} is important.`;
}

function placeCorrectAnswer(correct, distractorA, distractorB, correctOptionIndex) {
  const options = [distractorA, distractorB];
  options.splice(correctOptionIndex, 0, correct);
  return options;
}

function sanitizeWordEntries(entries, mode) {
  if (!Array.isArray(entries)) return [];

  const seenWords = new Set();
  const output = [];

  for (const raw of entries) {
    const word = normalizeWord(raw?.word);
    const definition = toSentenceCase(raw?.definition);
    const sentence = String(raw?.sentence || "").trim();
    const phonetic = String(raw?.phonetic || "").trim();
    if (!word || !definition || !sentence) continue;

    const wordLength = lettersOnly(word).length;
    if (wordLength < mode.minWordLength || wordLength > mode.maxWordLength) {
      continue;
    }
    if (seenWords.has(word)) continue;

    const normalizedSentence = containsWholeWord(sentence, word)
      ? sentence
      : `${toSentenceCase(word)} appears in this sentence.`;

    output.push({
      word,
      definition,
      sentence: normalizedSentence,
      phonetic
    });
    seenWords.add(word);
  }

  return output;
}

function buildQuestion(entry, entries, index, modeId) {
  const type = QUESTION_TYPES[index % QUESTION_TYPES.length];
  const distractorA = entries[(index + 1) % entries.length];
  const distractorB = entries[(index + 2) % entries.length];
  const correctOptionIndex = index % 3;
  const id = `${modeId}_q${String(index + 1).padStart(2, "0")}`;

  if (type === "guess_word") {
    return {
      id,
      type,
      prompt: entry.definition,
      word: entry.word,
      phonetic: entry.phonetic,
      definition: entry.definition,
      sentence: entry.sentence,
      options: placeCorrectAnswer(
        entry.word,
        distractorA.word,
        distractorB.word,
        correctOptionIndex
      ),
      correctOptionIndex
    };
  }

  if (type === "meaning_match") {
    return {
      id,
      type,
      prompt: entry.word,
      word: entry.word,
      phonetic: entry.phonetic,
      definition: entry.definition,
      sentence: entry.sentence,
      options: placeCorrectAnswer(
        entry.definition,
        distractorA.definition,
        distractorB.definition,
        correctOptionIndex
      ),
      correctOptionIndex
    };
  }

  return {
    id,
    type,
    prompt: maskWordInSentence(entry.sentence, entry.word),
    word: entry.word,
    phonetic: entry.phonetic,
    definition: entry.definition,
    sentence: entry.sentence,
    options: placeCorrectAnswer(entry.word, distractorA.word, distractorB.word, correctOptionIndex),
    correctOptionIndex
  };
}

function buildModePayload(mode, entries, source) {
  const questions = entries.map((entry, index) => buildQuestion(entry, entries, index, mode.id));

  return {
    modeId: mode.id,
    displayName: mode.displayName,
    audience: mode.audience,
    tier: mode.tier,
    gradeBand: mode.gradeBand,
    rules: {
      minWordLength: mode.minWordLength,
      maxWordLength: mode.maxWordLength,
      allowedQuestionTypes: QUESTION_TYPES
    },
    questions,
    metadata: {
      source,
      generatedAt: new Date().toISOString(),
      questionCount: questions.length,
      wordCount: entries.length
    }
  };
}

function pickModes(modeFilter) {
  if (!modeFilter || modeFilter.length === 0) return MODE_CONFIGS;
  const allowed = new Set(modeFilter);
  return MODE_CONFIGS.filter((mode) => allowed.has(mode.id));
}

function extractOutputText(responseJson) {
  if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }

  const chunks = [];
  const outputItems = Array.isArray(responseJson?.output) ? responseJson.output : [];
  for (const item of outputItems) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) chunks.push(part.text);
      if (typeof part?.output_text === "string" && part.output_text.trim()) {
        chunks.push(part.output_text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function extractJsonBlock(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }

  return cleaned;
}

async function generateWordsWithOpenAI(mode, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const prompt = [
    "Generate vocabulary seed content for a kids/adult quiz app.",
    "Return JSON only with this shape:",
    '{"words":[{"word":"", "definition":"", "sentence":"", "phonetic":""}]}',
    `Mode id: ${mode.id}`,
    `Audience: ${mode.audience}`,
    `Tier: ${mode.tier}`,
    `Grade band: ${mode.gradeBand}`,
    `Word length constraint: ${mode.minWordLength}-${mode.maxWordLength} letters`,
    "Provide exactly 12 words.",
    "Definitions and sentences must be plain and age appropriate for the mode.",
    "Each sentence must include the exact word.",
    "Words must be unique and lowercase."
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  const parsed = JSON.parse(extractJsonBlock(outputText));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.words)) return parsed.words;
  throw new Error("OpenAI output did not contain a words array.");
}

async function loadWordBanks() {
  const raw = await fs.readFile(wordBankPath, "utf8");
  return JSON.parse(raw);
}

async function writeModeFile(outDir, payload, dryRun) {
  const filePath = path.join(outDir, `${payload.modeId}.json`);
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  if (dryRun) return filePath;
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(filePath, body, "utf8");
  return filePath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const wordBanks = await loadWordBanks();
  const selectedModes = pickModes(args.modeFilter);

  if (selectedModes.length === 0) {
    throw new Error("No modes selected. Check --only=<mode_id> values.");
  }

  console.log(`Generating ${selectedModes.length} mode file(s) in ${args.outDir}`);

  for (const mode of selectedModes) {
    let source = "seed_word_banks";
    let entries = null;

    if (args.useAi) {
      try {
        const aiEntries = await generateWordsWithOpenAI(mode, args.model);
        entries = sanitizeWordEntries(aiEntries, mode);
        source = "openai_seed";
        if (entries.length < 10) {
          throw new Error(
            `AI produced ${entries.length} valid words for ${mode.id}; need at least 10.`
          );
        }
      } catch (error) {
        console.warn(
          `[warn] AI seed failed for ${mode.id}. Falling back to local seed bank. ${error.message}`
        );
        entries = null;
      }
    }

    if (!entries) {
      entries = sanitizeWordEntries(wordBanks[mode.id], mode);
      source = "seed_word_banks";
    }

    if (entries.length < 10) {
      throw new Error(
        `Mode ${mode.id} has only ${entries.length} valid entries after filtering. Need at least 10.`
      );
    }

    const payload = buildModePayload(mode, entries, source);
    const filePath = await writeModeFile(args.outDir, payload, args.dryRun);
    console.log(`[ok] ${mode.id} -> ${filePath}`);
  }
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exit(1);
});
