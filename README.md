# Vocabulary React MVP

React + TypeScript + Tailwind implementation scaffold for recreating the vocabulary game flow from `inspiration/` screenshots.

## Requirements

- Node 20+
- npm

## Install

```bash
npm install
```

## Run App

```bash
npm run dev
```

## Content Pipeline

- Generate mode files from local seed data:

```bash
npm run seed:modes
```

- Generate mode files from AI:

```bash
set OPENAI_API_KEY=your_key_here
npm run seed:modes:ai
```

- Validate mode files:

```bash
npm run validate:modes
```

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run quality
```

## Git Hooks

After cloning:

```bash
npm run prepare
```

This enables:

- `pre-commit`: `lint-staged`
- `pre-push`: full `npm run quality`

## Project Docs

- Product/UX plan: `PROJECT_PLAN.md`
- Claude handoff brief: `CLAUDE_HANDOFF.md`
- Guardrails: `ENGINEERING_GUARDRAILS.md`
- Design system contract: `DESIGN_SYSTEM.md`
- Content pipeline: `CONTENT_PIPELINE.md`
