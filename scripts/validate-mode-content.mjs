#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const modesDir = path.join(rootDir, "content", "modes");

const ALLOWED_QUESTION_TYPES = ["guess_word", "meaning_match", "fill_gap"];

const MODE_POLICIES = {
  kids_beginner: {
    audience: "kids",
    tier: "beginner",
    gradeBand: "K-1",
    minWordLength: 3,
    maxWordLength: 3
  },
  kids_intermediate: {
    audience: "kids",
    tier: "intermediate",
    gradeBand: "2-3",
    minWordLength: 4,
    maxWordLength: 5
  },
  kids_advanced: {
    audience: "kids",
    tier: "advanced",
    gradeBand: "4-5",
    minWordLength: 5,
    maxWordLength: 7
  },
  adult_beginner: {
    audience: "adult",
    tier: "beginner",
    gradeBand: "Adult",
    minWordLength: 6,
    maxWordLength: 8
  },
  adult_intermediate: {
    audience: "adult",
    tier: "intermediate",
    gradeBand: "Adult",
    minWordLength: 7,
    maxWordLength: 9
  },
  adult_advanced: {
    audience: "adult",
    tier: "advanced",
    gradeBand: "Adult",
    minWordLength: 8,
    maxWordLength: 12
  }
};

const REQUIRED_ROOT_KEYS = [
  "modeId",
  "displayName",
  "audience",
  "tier",
  "gradeBand",
  "rules",
  "questions",
  "metadata"
];

const REQUIRED_RULE_KEYS = ["minWordLength", "maxWordLength", "allowedQuestionTypes"];

const REQUIRED_QUESTION_KEYS = [
  "id",
  "type",
  "prompt",
  "word",
  "phonetic",
  "definition",
  "sentence",
  "options",
  "correctOptionIndex"
];

const REQUIRED_METADATA_KEYS = ["source", "generatedAt", "questionCount", "wordCount"];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function lettersOnlyLength(word) {
  return normalizeText(word).replace(/[^a-z]/g, "").length;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function containsWholeWord(sentence, word) {
  const escaped = normalizeText(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return false;
  return new RegExp(`\\b${escaped}\\b`, "i").test(String(sentence || ""));
}

function validateAllowedKeys(target, allowedKeys, pathPrefix, errors) {
  if (!target || typeof target !== "object" || Array.isArray(target)) {
    errors.push(`${pathPrefix} must be an object.`);
    return;
  }
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(target)) {
    if (!allowed.has(key)) {
      errors.push(`${pathPrefix}.${key} is not allowed.`);
    }
  }
}

function validateModePayload(data, filePath) {
  const errors = [];

  validateAllowedKeys(data, REQUIRED_ROOT_KEYS, "root", errors);
  for (const key of REQUIRED_ROOT_KEYS) {
    if (!(key in data)) errors.push(`Missing required root key: ${key}`);
  }

  if (!isNonEmptyString(data.modeId)) {
    errors.push("modeId must be a non-empty string.");
    return errors;
  }

  const policy = MODE_POLICIES[data.modeId];
  if (!policy) {
    errors.push(`Unknown modeId '${data.modeId}' in ${filePath}`);
    return errors;
  }

  if (!filePath.endsWith(`${data.modeId}.json`)) {
    errors.push(`Filename does not match modeId '${data.modeId}'.`);
  }

  if (!isNonEmptyString(data.displayName)) errors.push("displayName must be non-empty.");
  if (data.audience !== policy.audience) {
    errors.push(`audience must be '${policy.audience}' for mode '${data.modeId}'.`);
  }
  if (data.tier !== policy.tier) {
    errors.push(`tier must be '${policy.tier}' for mode '${data.modeId}'.`);
  }
  if (data.gradeBand !== policy.gradeBand) {
    errors.push(`gradeBand must be '${policy.gradeBand}' for mode '${data.modeId}'.`);
  }

  validateAllowedKeys(data.rules, REQUIRED_RULE_KEYS, "rules", errors);
  for (const key of REQUIRED_RULE_KEYS) {
    if (!(key in (data.rules || {}))) errors.push(`Missing required rules key: ${key}`);
  }

  if (data.rules?.minWordLength !== policy.minWordLength) {
    errors.push(`rules.minWordLength must be ${policy.minWordLength} for mode '${data.modeId}'.`);
  }
  if (data.rules?.maxWordLength !== policy.maxWordLength) {
    errors.push(`rules.maxWordLength must be ${policy.maxWordLength} for mode '${data.modeId}'.`);
  }

  const allowedTypes = Array.isArray(data.rules?.allowedQuestionTypes)
    ? data.rules.allowedQuestionTypes
    : [];
  const typeSet = new Set(allowedTypes);
  for (const t of ALLOWED_QUESTION_TYPES) {
    if (!typeSet.has(t)) {
      errors.push(`rules.allowedQuestionTypes must include '${t}'.`);
    }
  }
  for (const t of allowedTypes) {
    if (!ALLOWED_QUESTION_TYPES.includes(t)) {
      errors.push(`rules.allowedQuestionTypes includes unsupported type '${t}'.`);
    }
  }

  if (!Array.isArray(data.questions)) {
    errors.push("questions must be an array.");
  } else {
    if (data.questions.length < 10) {
      errors.push(`questions must contain at least 10 entries (got ${data.questions.length}).`);
    }

    const seenQuestionIds = new Set();
    const seenWords = new Set();
    const typeCounts = {
      guess_word: 0,
      meaning_match: 0,
      fill_gap: 0
    };

    data.questions.forEach((q, index) => {
      const prefix = `questions[${index}]`;
      validateAllowedKeys(q, REQUIRED_QUESTION_KEYS, prefix, errors);
      for (const key of REQUIRED_QUESTION_KEYS) {
        if (!(key in q)) errors.push(`${prefix}: missing required key '${key}'.`);
      }

      if (!isNonEmptyString(q.id)) {
        errors.push(`${prefix}.id must be non-empty.`);
      } else if (seenQuestionIds.has(q.id)) {
        errors.push(`${prefix}.id '${q.id}' is duplicated.`);
      } else {
        seenQuestionIds.add(q.id);
      }

      if (!ALLOWED_QUESTION_TYPES.includes(q.type)) {
        errors.push(`${prefix}.type '${q.type}' is invalid.`);
      } else {
        typeCounts[q.type] += 1;
      }

      if (!isNonEmptyString(q.prompt)) errors.push(`${prefix}.prompt must be non-empty.`);
      if (!isNonEmptyString(q.word)) errors.push(`${prefix}.word must be non-empty.`);
      if (!isNonEmptyString(q.definition)) {
        errors.push(`${prefix}.definition must be non-empty.`);
      }
      if (!isNonEmptyString(q.sentence)) errors.push(`${prefix}.sentence must be non-empty.`);
      if (typeof q.phonetic !== "string") errors.push(`${prefix}.phonetic must be a string.`);

      const wordLen = lettersOnlyLength(q.word);
      if (wordLen < policy.minWordLength || wordLen > policy.maxWordLength) {
        errors.push(
          `${prefix}.word '${q.word}' length ${wordLen} is outside ${policy.minWordLength}-${policy.maxWordLength}.`
        );
      }

      const wordKey = normalizeText(q.word);
      seenWords.add(wordKey);

      if (!Array.isArray(q.options) || q.options.length !== 3) {
        errors.push(`${prefix}.options must be an array of exactly 3 strings.`);
      } else {
        const uniqueOptions = new Set(q.options.map((value) => normalizeText(value)));
        if (uniqueOptions.size !== 3) {
          errors.push(`${prefix}.options must contain 3 unique values.`);
        }
        for (const [i, option] of q.options.entries()) {
          if (!isNonEmptyString(option)) {
            errors.push(`${prefix}.options[${i}] must be non-empty.`);
          }
        }
      }

      if (
        !Number.isInteger(q.correctOptionIndex) ||
        q.correctOptionIndex < 0 ||
        q.correctOptionIndex > 2
      ) {
        errors.push(`${prefix}.correctOptionIndex must be 0, 1, or 2.`);
      } else if (Array.isArray(q.options) && q.options.length === 3) {
        const expected = q.type === "meaning_match" ? q.definition : q.word;
        const selected = q.options[q.correctOptionIndex];
        if (normalizeText(selected) !== normalizeText(expected)) {
          errors.push(
            `${prefix}.correctOptionIndex does not point at the expected correct answer.`
          );
        }
      }

      if (q.type === "fill_gap" && !/_/.test(q.prompt || "")) {
        errors.push(`${prefix}.prompt for fill_gap must include underscores.`);
      }

      if (!containsWholeWord(q.sentence, q.word)) {
        errors.push(`${prefix}.sentence must include the exact word '${q.word}'.`);
      }
    });

    for (const type of ALLOWED_QUESTION_TYPES) {
      if (typeCounts[type] === 0) {
        errors.push(`questions must include at least one '${type}' question.`);
      }
    }

    if (seenWords.size < 10) {
      errors.push(`questions should include at least 10 unique words (got ${seenWords.size}).`);
    }
  }

  validateAllowedKeys(data.metadata, REQUIRED_METADATA_KEYS, "metadata", errors);
  for (const key of REQUIRED_METADATA_KEYS) {
    if (!(key in (data.metadata || {}))) {
      errors.push(`Missing required metadata key: ${key}`);
    }
  }

  if (!isNonEmptyString(data.metadata?.source)) {
    errors.push("metadata.source must be non-empty.");
  }
  if (!isNonEmptyString(data.metadata?.generatedAt)) {
    errors.push("metadata.generatedAt must be non-empty.");
  } else if (Number.isNaN(Date.parse(data.metadata.generatedAt))) {
    errors.push("metadata.generatedAt must be an ISO-8601 date-time.");
  }

  if (!Number.isInteger(data.metadata?.questionCount)) {
    errors.push("metadata.questionCount must be an integer.");
  } else if (
    Array.isArray(data.questions) &&
    data.metadata.questionCount !== data.questions.length
  ) {
    errors.push("metadata.questionCount must match questions.length.");
  }

  if (!Number.isInteger(data.metadata?.wordCount) || data.metadata.wordCount < 1) {
    errors.push("metadata.wordCount must be a positive integer.");
  }

  return errors;
}

async function listModeFiles() {
  const entries = await fs.readdir(modesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(modesDir, entry.name));
}

async function main() {
  const fileArgs = process.argv.slice(2);
  const targets = fileArgs.length > 0 ? fileArgs : await listModeFiles();

  if (targets.length === 0) {
    throw new Error("No mode files found. Generate content first.");
  }

  let totalErrors = 0;

  // Cross-mode duplicate tracking: word → first mode file that claimed it
  const globalWordMap = new Map();

  for (const target of targets) {
    const absolutePath = path.isAbsolute(target) ? target : path.join(rootDir, target);
    let data;
    try {
      const raw = await fs.readFile(absolutePath, "utf8");
      data = JSON.parse(raw);
    } catch (error) {
      console.error(`[error] Failed to read/parse ${absolutePath}: ${error.message}`);
      totalErrors += 1;
      continue;
    }

    const errors = validateModePayload(data, absolutePath);

    // Check for cross-mode duplicate words
    if (Array.isArray(data.questions)) {
      const fileName = path.basename(absolutePath);
      for (const q of data.questions) {
        if (!isNonEmptyString(q.word)) continue;
        const wordKey = normalizeText(q.word);
        const existingFile = globalWordMap.get(wordKey);
        if (existingFile && existingFile !== fileName) {
          errors.push(
            `word '${q.word}' also appears in ${existingFile} (cross-mode duplicate).`
          );
        } else {
          globalWordMap.set(wordKey, fileName);
        }
      }
    }

    if (errors.length === 0) {
      console.log(`[ok] ${absolutePath}`);
      continue;
    }

    console.error(`[error] ${absolutePath}`);
    for (const issue of errors) {
      console.error(`  - ${issue}`);
    }
    totalErrors += errors.length;
  }

  if (totalErrors > 0) {
    console.error(`[error] Validation failed with ${totalErrors} issue(s).`);
    process.exit(1);
  }

  console.log("[ok] All mode files passed validation.");
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exit(1);
});
