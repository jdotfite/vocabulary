# Claude Build Handoff

## Objective

Build a React + TypeScript + Tailwind app that reproduces the UI style and core gameplay flow shown in `inspiration/*.png`, using static JSON mode content.

## Must-Read Files

- `PROJECT_PLAN.md`
- `CONTENT_PIPELINE.md`
- `ENGINEERING_GUARDRAILS.md`
- `DESIGN_SYSTEM.md`
- `content/modes/*.json`

## Locked Product Decisions

- No DB in MVP.
- No runtime AI in MVP.
- AI is allowed only for one-time seed generation through `scripts/seed-content-from-ai.mjs`.
- Gameplay uses static JSON files in `content/modes/`.

## Tier Set (MVP)

- `kids_easy` (K-1)
- `kids_middle` (2-3)
- `kids_advanced` (4-5)
- `adult_elementary`
- `adult_intermediate`
- `adult_advanced`

## Build Scope

- Mode select screen for 6 tiers.
- In-quiz gameplay screen with progress bar, mode chip, stacked prompt card, three answer buttons, answer feedback bottom sheet, and leave-confirmation bottom sheet.
- Post-quiz screens for celebration summary, results list, and vocabulary level.
- Reusable components and tokenized styling only (no one-off inline styling unless documented exception).

## Out of Scope (MVP)

- Authentication
- Backend/API
- DB persistence
- Daily cron generation
- Social features beyond static `Share` UI affordance

## Content Integration Requirements

- Load mode file by selected `modeId` from `content/modes/`.
- Use `questions[]` to drive quiz sequence.
- Do not hardcode question text in components.
- Validate content with `npm run validate:modes` before each release build.

## Required Deliverables

- Production-ready React app in this repository.
- All screens and flows listed above working end-to-end.
- Design system implementation per `DESIGN_SYSTEM.md`.
- Tooling and quality gates per `ENGINEERING_GUARDRAILS.md`.
- Unit tests for core game state transitions and key UI states.
- README updates for local run, lint, typecheck, test, and build.

## Acceptance Criteria

- Visual style closely matches `inspiration/*.png` on mobile widths.
- No TypeScript errors (`tsc --noEmit` passes).
- ESLint passes with zero warnings.
- Test suite passes.
- App build passes.
- Mode data validation passes.

## Suggested Delivery Phases

1. Scaffold app, install quality/tooling baseline, enforce guardrails.
2. Implement tokens, typography, and reusable primitives.
3. Implement quiz flow and feedback/leave sheets.
4. Implement summary/results/level screens.
5. Add tests, polish responsiveness, and run full quality gate.

## Final Verification Command Set

```bash
npm run validate:modes
npm run lint
npm run typecheck
npm run test
npm run build
```
