# Task: Guardrails UI polish

**Completed:** 2025-11-16

## User request (summary)
- Numeric stepper buttons must accelerate 1 → 5 → 10 → 50 → 100 during sustained press across guardrail and plugin editors.
- Profile JSON editor needs horizontal/vertical scrolling without escaping layout width.
- Brand header should respect themes while keeping the turquoise logo readable, with brighter white blur behind the logo.

## Context and constraints
- Keep UI changes aligned with design tokens in `App.css` and avoid OS-specific logic (per doc/architecture.md).
- Reuse the new `AcceleratingNumberInput` component for all numeric fields to maintain interaction consistency.
- No regressions to existing Vitest coverage; maintain ≥90% UI coverage.

## Implementation Summary
All steps completed successfully:

1. Replaced remaining numeric inputs (plugins, actions, risk threshold) with `AcceleratingNumberInput` and ensured inline layout.
2. Added shared styling tokens for the accelerating input (focus, hover, disabled) so it blends with light/dark themes.
3. Updated `ProfileEditor` JSON textarea/container to support wrap-safe width plus horizontal/vertical scroll.
4. Refreshed brand header CSS (theme-aware background/border, turquoise logo wrapper, stronger white blur/drop shadow).
5. Ran targeted UI tests (`bun test monitor-control` + profile editor suite) - 11 tests passed.

## Progress log
- 2025-11-16 — Completed Step 1: audited `src/plugins/builtins.tsx` and swapped every number input for `AcceleratingNumberInput` with flex labels.
- 2025-11-16 — Completed Steps 2–4: added shared styles for the accelerating control, wrapped the profile JSON textarea in a scrollable shell, and refreshed the brand header/logo glow so it honors light/dark themes.
- 2025-11-16 — Completed Step 5 by running `bunx vitest run tests/profileeditor.vitest.tsx tests/monitor-control.vitest.tsx` (11 tests passed).

## Follow-ups / future work
- Consider reusing the accelerating control within any future numeric dialogs (GraphComposer, advanced guardrails) once designed.
