# Content Pipeline (MVP)

This project uses static JSON mode files for gameplay content.

## Tier Set

- `kids_easy` (K-1)
- `kids_middle` (2-3)
- `kids_advanced` (4-5)
- `adult_elementary`
- `adult_intermediate`
- `adult_advanced`

## Commands

- Generate mode files from local seed bank:

```bash
npm run seed:modes
```

- Generate mode files from AI (falls back to seed bank on failures):

```bash
set OPENAI_API_KEY=your_key_here
npm run seed:modes:ai
```

- Validate generated mode files:

```bash
npm run validate:modes
```

- Generate then validate:

```bash
npm run seed:validate
```

## Output Files

Generated content is written to:

- `content/modes/kids_easy.json`
- `content/modes/kids_middle.json`
- `content/modes/kids_advanced.json`
- `content/modes/adult_elementary.json`
- `content/modes/adult_intermediate.json`
- `content/modes/adult_advanced.json`

## Guarantees from Validation

- Tier metadata matches configured policy.
- Word lengths match tier ranges.
- Every question has exactly 3 options.
- Correct answer index points to the expected answer.
- All three question types are present.
- `fill_gap` prompts include a visible blank.
- Question count and metadata are internally consistent.

## Related Build Docs

- `CLAUDE_HANDOFF.md`
- `ENGINEERING_GUARDRAILS.md`
- `DESIGN_SYSTEM.md`
