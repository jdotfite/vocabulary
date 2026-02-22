# Engineering Guardrails

This document defines non-negotiable quality gates for the React + TypeScript build.

## Tooling Baseline

- Runtime: Node 20+
- Package manager: npm
- Framework: React + TypeScript (Vite)
- Styling: Tailwind CSS
- Testing: Vitest + Testing Library
- Linting: ESLint (flat config)
- Formatting: Prettier + `prettier-plugin-tailwindcss`
- Git hooks: Husky + lint-staged

## Setup Commands (After React Scaffold)

```bash
npm install
npm install -D eslint @eslint/js typescript-eslint eslint-config-prettier prettier prettier-plugin-tailwindcss
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D husky lint-staged
npx husky init
```

## Required npm Scripts

- `lint`: `eslint . --max-warnings=0`
- `typecheck`: `tsc --noEmit`
- `test`: `vitest run`
- `test:watch`: `vitest`
- `format`: `prettier . --write`
- `format:check`: `prettier . --check`
- `build`: app production build
- `validate:modes`: `node scripts/validate-mode-content.mjs`
- `quality`: run `validate:modes`, `lint`, `typecheck`, `test`, `build` in order

## TypeScript Rules

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- Do not use `any` unless an issue is documented with a TODO owner.

## ESLint Rules (Minimum)

- Disallow unused variables/imports.
- Disallow explicit `any`.
- Disallow floating promises.
- Enforce exhaustive deps for React hooks.
- Enforce import/order consistency.
- ESLint warnings are treated as failures.

## Husky and lint-staged

Create `.husky/pre-commit`:

```bash
npx lint-staged
```

Create `.husky/pre-push`:

```bash
npm run quality
```

`lint-staged` policy:

- `*.{ts,tsx}` -> `eslint --max-warnings=0 --fix`, `prettier --write`
- `*.{json,md,css}` -> `prettier --write`

## CI Gate

Every PR must run:

1. `npm run validate:modes`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

## Testing Requirements

- Unit tests for quiz reducer/state transitions: answer selection lock behavior, correct/incorrect scoring behavior, next-question progression, and end-of-quiz completion behavior.
- Component tests for `OptionButton` state variants, feedback sheet visibility/content, and leave sheet open/close actions.

## Code Review Requirements

- No hardcoded color hex values in components.
- No duplicated layout primitives when a reusable component exists.
- All new components include typed props and at least one usage example.
- Any skipped guardrail must be documented in PR notes with reason and follow-up.
