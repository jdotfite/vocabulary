# Design System Contract

This document defines reusable tokens, primitives, and component contracts for the vocabulary app.

## Goals

- Match screenshot style closely.
- Keep styling tokenized and reusable.
- Prevent one-off component styles that drift from system look.

## Token Architecture

Define tokens in Tailwind config and/or CSS variables.

## Color Tokens

- `color.bg.app`: `#2B2B2B`
- `color.bg.appDeep`: `#1D1D1D`
- `color.bg.surface`: `#3A3A3A`
- `color.bg.surfaceAlt`: `#404040`
- `color.bg.sheet`: `#2B2B2B`
- `color.text.primary`: `#FFFFFF`
- `color.text.secondary`: `#ADADAD`
- `color.border.strong`: `#000000`
- `color.accent.teal`: `#93C1C1`
- `color.accent.tealBright`: `#A4D0D0`
- `color.state.correct`: `#779158`
- `color.state.correctIcon`: `#AFD681`
- `color.state.incorrect`: `#A56459`
- `color.state.errorIcon`: `#F39483`

## Typography Tokens

- Display font: serif-like (for large titles and level headers).
- UI font: sans-serif (for controls and body).
- `font.size.display`: summary headline size
- `font.size.h1`: primary screen title size
- `font.size.button`: option/CTA label size
- `font.size.body`: default body text size
- `font.weight.semibold` and `font.weight.bold` for key hierarchy.

## Shape and Motion Tokens

- `radius.card`: large rounded corners for cards
- `radius.button`: large rounded corners for CTAs/options
- `border.width.strong`: thick dark outlines on interactive blocks
- `motion.duration.fast`: for tap feedback
- `motion.duration.sheet`: for bottom sheet in/out

## Layout Tokens

- `space.screenX`: horizontal page padding
- `space.stack`: default vertical spacing between sections
- `space.optionGap`: vertical option spacing
- `size.optionHeight`: fixed option button height
- `size.bottomCtaHeight`: fixed primary CTA height

## Required Folder Structure

```text
src/
  design-system/
    tokens/
      colors.ts
      typography.ts
      spacing.ts
      radius.ts
      motion.ts
    primitives/
      Surface.tsx
      Button.tsx
      BottomSheet.tsx
      Text.tsx
    components/
      TopProgressBar.tsx
      ModeChip.tsx
      PromptCard.tsx
      OptionButton.tsx
      FeedbackSheet.tsx
      LeaveConfirmSheet.tsx
      ScoreRing.tsx
      StreakDots.tsx
      ResultsListItem.tsx
      LevelLadder.tsx
```

## Component API Contracts

`OptionButton`

- Props: `label: string`, `state: "default" | "correct" | "incorrect" | "disabled"`, `showCheckIcon?: boolean`, `onClick?: () => void`.

`FeedbackSheet`

- Props: `open: boolean`, `status: "correct" | "incorrect"`, `word: string`, `phonetic: string`, `definition: string`, `sentence: string`, `onNext: () => void`.

`TopProgressBar`

- Props: `progress: number` (`0..1`), `onClose: () => void`.

`PromptCard`

- Props: `text: string`, `modeLabel?: string`.

`LevelLadder`

- Props: `levels: string[]`, `currentLevel: string`, `progressToNext: number` (`0..1`).

## Reuse Rules

- No hardcoded hex values inside component files.
- No repeated button/card styles: use primitives.
- All interactive components must expose disabled/focus-visible styles.
- State styling must map to semantic tokens (`correct`, `incorrect`, `accent`) not raw color names.

## Accessibility Rules

- Minimum contrast for readable text on dark backgrounds.
- Keyboard focus ring visible on all interactive controls.
- Bottom sheets must trap focus while open.
- Buttons and list actions need clear `aria-label`s.

## Definition of Done for Design System

- Every gameplay screen is built from primitives/components in this system.
- Shared tokens control color/spacing/radius/typography globally.
- New screen implementation requires little or no custom CSS.
