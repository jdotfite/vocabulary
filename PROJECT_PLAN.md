# Vocabulary Game Recreation Plan (React + Tailwind)

## Goal

Recreate the core gameplay and visual style from the screenshots in a mobile-first React app using Tailwind CSS.

## MVP Product Decisions (Locked)

- Content source: static JSON files in-repo.
- Database: none for MVP.
- AI usage: one-time offline generation of initial word/question seed only.
- Runtime AI: none.
- Daily cron generation: not in MVP.
- Tier model in MVP has 6 modes:
- `kids_easy` (Kindergarten to 1st grade)
- `kids_middle` (2nd to 3rd grade)
- `kids_advanced` (4th to 5th grade)
- `adult_elementary`
- `adult_intermediate`
- `adult_advanced`

## What We Can Infer From Screenshots

The captured flow includes:

- In-quiz question screens with 3 answer choices.
- Three quiz types: `Guess the word`, `Meaning match`, and `Fill in the gap`.
- Immediate answer feedback:
- Correct state turns selected option green and shows a check icon.
- Incorrect state turns chosen option salmon/red and the right option green.
- Bottom feedback panel after each answer with status title, word metadata, explanatory text, and `Next word`.
- Exit confirmation bottom sheet (`Leaving already?`, `Keep playing`, `Leave`).
- Post-quiz summary screen with circular score ring, confetti, streak row, and `See results`.
- Results list screen with per-word correctness, definition, pronunciation/audio, and favorite/bookmark actions.
- Vocabulary level screen with level card, score stats, vertical progression ladder, and `See answers`.

Note: exact navigation order between `Great work`, `Your results`, and `Vocabulary level` is inferred from screenshots, not confirmed.

## UX Flow (Proposed)

1. `Session Start` -> show question 1/10 with top progress bar.
2. `Answer Selected` -> lock options and show feedback colors.
3. `Feedback Panel Open` -> user taps `Next word`.
4. Repeat until all questions complete.
5. `Great Work Summary` -> `See results`.
6. `Results List` -> review answers, then `Finish`.
7. `Vocabulary Level` -> `See answers` (or return/home based on product decision).
8. At any quiz point, tapping close icon opens `Leaving already?` sheet.

## UI Style Spec (Tailwind Tokens)

Create design tokens in `tailwind.config.ts` to keep styling consistent.

Suggested tokens (sampled from screenshots, then grouped semantically):

- `bg.app`: `#2B2B2B`
- `bg.appDeep`: `#1D1D1D`
- `bg.surface`: `#3A3A3A`
- `bg.surfaceAlt`: `#404040`
- `bg.sheet`: `#2B2B2B`
- `text.primary`: `#FFFFFF`
- `text.secondary`: `#ADADAD`
- `border.strong`: `#000000`
- `accent.teal`: `#93C1C1`
- `accent.tealBright`: `#A4D0D0`
- `state.correct`: `#779158`
- `state.correctIcon`: `#AFD681`
- `state.incorrect`: `#A56459`
- `state.errorIcon`: `#F39483`

Core shape rules:

- Large rounded cards/buttons: `rounded-3xl` to `rounded-[24px]`.
- Heavy outline borders: `border-2 border-[color:var(--border-strong)]`.
- Option buttons: fixed height with bold centered labels.
- Bottom sheets: high corner radius, full width, anchored to bottom.

Typography:

- Display/headline font (serif-like): use `Merriweather` or `Lora`.
- UI/body font: use `Inter` or `Nunito Sans`.
- Scale guidance:
- Big headline: `text-5xl`/`text-4xl` on summary screens.
- Section title: `text-3xl`/`text-2xl`.
- Option label: `text-2xl` semibold.
- Supporting text: `text-base` to `text-sm`.

## React App Architecture

Recommended stack:

- `Vite + React + TypeScript`
- `Tailwind CSS`
- `Framer Motion` for sheet transitions/confetti staging
- `zustand` (or React Context) for session state

Suggested route map:

- `/play` quiz screen
- `/summary` great work screen
- `/results` results list
- `/level` vocabulary level

State model:

- `questions[]`
- `currentIndex`
- `selectedOptionId`
- `isAnswered`
- `isCorrect`
- `score`
- `showFeedbackSheet`
- `showLeaveSheet`
- `results[]` (per question correctness + metadata)
- `streakData`, `avgData`, `levelData`

## Component Breakdown

- `MobileFrame` (20:9 aspect, centered app shell)
- `TopProgressBar` (close icon + progress)
- `ModeChip` (`Guess the word`, etc.)
- `PromptCard` (with layered background effect)
- `OptionButton` (default/correct/incorrect/disabled states)
- `FeedbackSheet` (correct/incorrect variants)
- `LeaveConfirmSheet`
- `ScoreRing`
- `StreakDots`
- `ResultsListItem`
- `LevelLadder`
- `PrimaryCTA`

## Screen-by-Screen Build Order

1. Build reusable tokens + shell + typography.
2. Build quiz screen with static mock data and all option states.
3. Add feedback sheet logic and `Next word` flow.
4. Add leave confirmation sheet.
5. Add summary screen (ring + confetti + streak row).
6. Add results list and item interactions.
7. Add vocabulary level screen and ladder indicator.
8. Wire navigation and state transitions end to end.
9. Polish spacing/typography to pixel-match screenshots.

## Interaction Details To Match

- Progress bar has rounded track and teal fill.
- Prompt card uses subtle stacked/tilted layers.
- Feedback appears as bottom-docked panel, not centered modal.
- Incorrect answer mode highlights both wrong picked option and correct answer.
- Correct answer mode shows check icon in selected option.
- Buttons use dark outlines with soft inner contrast.
- `Share` action appears top-right on summary/level screens.

## Data and Content Requirements

Each question needs:

- `type` (`guess_word`, `meaning_match`, `fill_gap`)
- `word`
- `prompt`
- `options[]` (3 choices)
- `correctOptionId`
- `phonetic`
- `definition`
- `sentence`

Each result row needs:

- correctness status
- word + phonetic + optional audio reference
- definition
- sentence
- favorite/bookmark flags

MVP content layout (recommended):

- `content/modes/kids_easy.json`
- `content/modes/kids_middle.json`
- `content/modes/kids_advanced.json`
- `content/modes/adult_elementary.json`
- `content/modes/adult_intermediate.json`
- `content/modes/adult_advanced.json`

Tier constraints for MVP seed content:

- `kids_easy`: 3-letter words only
- `kids_middle`: 4-5 letter words
- `kids_advanced`: 5-7 letter words
- `adult_elementary`: 6-8 letter words
- `adult_intermediate`: 7-9 letter words
- `adult_advanced`: 8-12 letter words

MVP JSON shape:

- `modeId`
- `displayName`
- `rules` (for example `minWordLength`, `maxWordLength`, allowed question types)
- `words[]` with `word`, `definition`, `sentence`, `phonetic`
- `questions[]` with 3-option multiple choice entries

AI seed workflow (one-time):

1. Generate candidate word lists per mode (all 6 tiers).
2. Generate question triplets and distractors for each word.
3. Run schema validation + difficulty checks.
4. Save validated JSON files to `content/modes/*.json`.
5. Manually review and trim before shipping.

## QA Checklist

- Mobile viewport behavior at `390x844`, `393x852`, and `430x932`.
- No layout jump when bottom sheet opens/closes.
- Option states remain locked after selection.
- Keyboard/screen-reader accessibility for choices and sheet actions.
- Color contrast remains readable on dark surfaces.
- End-to-end flow works from first question to level screen.

## Milestones

1. `M1`: Pixel-faithful quiz screen with interactive answer states.
2. `M2`: Complete in-quiz loop with feedback and exit confirmation.
3. `M3`: Post-quiz summary + results list.
4. `M4`: Level screen + final polish and responsive QA.

## Open Items

- App Store link was not included in the request text.
- Need link to confirm exact screen order and transitions.
- Need link to confirm exact font family used in production app.
- Need link to confirm missing states (loading, onboarding, streak failure, retry, share outcome).

## Handoff References

- Build brief: `CLAUDE_HANDOFF.md`
- Engineering quality gates: `ENGINEERING_GUARDRAILS.md`
- Design system contract: `DESIGN_SYSTEM.md`
- Content generation/validation pipeline: `CONTENT_PIPELINE.md`
