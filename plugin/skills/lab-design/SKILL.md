---
name: lab-design
description: Design v0 ("Flächen" / surfaces) rules for DS Labs interfaces with do and don't examples, the token list, component choice from @whz-ds-labs/ui, the two stylelint rules and the allow comment, and the 375 px and axe checks. Use whenever writing or reviewing CSS, templates or layout in a course repo.
---

# lab-design

Design v0 "Flächen": structure comes from **surfaces and spacing**, never from lines. Everything else follows from that.

## Rules

1. **No CSS lines as separators.** No `border-top/-bottom/-left/-right`, no visible `border` shorthand, no `<hr>` styles in layout CSS. Group content by placing it on a surface and separating groups with space.
2. **At most three surface levels:** page (`--ds-surface-page`), area (`--ds-surface-area`), card (`--ds-surface-card`). A card sits on an area, an area on the page. Do not invent a fourth level.
3. **One accent colour** (`--ds-accent`, text on it `--ds-accent-contrast`) for the primary action and the current selection. Status colours (`--ds-ok`, `--ds-warn`, `--ds-error`, `--ds-error-bg`) only for status.
4. **Colours only through `--ds-*` tokens** via `var()`. No hex, `rgb()`, `hsl()` or named colours in lab code.
5. **Clear hierarchy:** title, then controls, then result. The learner finds the result without scrolling past decoration.
6. **Click targets at least 40 px** (`--ds-hit`).
7. **Class colours always come with a shape** (`--ds-class-0` to `--ds-class-5` plus the marker shape from `classStyle`), so colour-blind learners can tell classes apart.
8. **Borders only on input fields and focus rings**, each marked with the allow comment (below). Focus uses `--ds-focus` outlines, never removed.
9. **States are visibly different:** `loading`, `empty`, `error`, `ready` each look distinct (use `StatusPanel`).
10. **Light and dark** through `prefers-color-scheme` come for free from the tokens; do not hard-code a theme.

## Tokens

Import once: `@whz-ds-labs/ui/tokens.css` (the course shell already does).

| Group | Tokens |
|---|---|
| Surfaces | `--ds-surface-page`, `--ds-surface-area`, `--ds-surface-card` |
| Text | `--ds-text`, `--ds-text-muted` |
| Accent | `--ds-accent`, `--ds-accent-contrast`, `--ds-focus` |
| Status | `--ds-ok`, `--ds-warn`, `--ds-error`, `--ds-error-bg` |
| Input | `--ds-input-border` |
| Plot | `--ds-plot-axis`, `--ds-plot-grid`, `--ds-points` |
| Classes | `--ds-class-0` … `--ds-class-5` |
| Space | `--ds-space-1` … `--ds-space-7` |
| Radius | `--ds-radius-s`, `--ds-radius-m`, `--ds-radius-l`, `--ds-radius-pill` |
| Type | `--ds-font-s`, `--ds-font-m`, `--ds-font-l`, `--ds-font-xl`, `--ds-weight-regular`, `--ds-weight-strong` |
| Target size | `--ds-hit` |

Read `node_modules/@whz-ds-labs/ui/tokens.css` for the current values; do not copy values into lab code.

## Do and don't

Separating two groups:

```css
/* don't */
.result { border-top: 1px solid #ddd; padding-top: 12px; }

/* do */
.result { background: var(--ds-surface-card); padding: var(--ds-space-4); margin-block-start: var(--ds-space-5); border-radius: var(--ds-radius-m); }
```

Colour:

```css
/* don't */
.hint { color: #666; background: rgb(255 240 200); }

/* do */
.hint { color: var(--ds-text-muted); background: var(--ds-surface-area); }
```

An input field (the one place for a border):

```css
.field {
  /* ds-labs-allow: input border keeps the field recognisable */
  border: 1px solid var(--ds-input-border);
  border-radius: var(--ds-radius-s);
  min-block-size: var(--ds-hit);
}
```

Plot lines (axes, grid, data lines) are SVG and use `stroke` with `--ds-plot-*` tokens. They are not CSS borders and are fine.

## Lint: the two rules and the allow comment

`npm run lint:css` runs stylelint with the lab-kit plugin on `site/` and `labs/` (`.css` and `.vue` styles):

- `ds-labs/no-separator-lines`: reports `border-*` with a visible line and `hr` selectors.
- `ds-labs/color-tokens-only`: reports hex, `rgb()`/`hsl()` and similar colour literals.

A justified exception goes in a comment **directly above the declaration**, with a reason:

```css
/* ds-labs-allow: <reason> */
border: 1px solid var(--ds-input-border);
```

An allow comment without a reason is itself reported. Use it for input fields only; if you feel you need it for layout, change the layout.

## Components from `@whz-ds-labs/ui`

Use these before writing your own.

| Need | Component |
|---|---|
| App frame, tool tabs, help and language buttons | `LabShell` (already used by the course site) |
| Help drawer from `HelpTopics` | `HelpDrawer` |
| Scenario switcher, note, and the area a scenario applies to | `ScenarioBar`, `ScenarioNote`, `ScenarioArea` |
| Numeric parameter | `LinearSlider` (linear), `RootSlider` (root scale) |
| Plot canvas, points, grid, regions | `PlotFrame`, `PointLayer`, `GridLayer`, `RegionLayer`, `plotScales` |
| Ranked values | `BarList` |
| Formula | `Formula` (KaTeX) |
| Loading, empty, error | `StatusPanel` |
| Notice about a corrected URL | `UrlNotice` |
| Reference to the textbook or notebook | `RefBadge` |

Check `node_modules/@whz-ds-labs/ui` types for props before use; do not guess.

## Checks that enforce it

- **375 px:** `expectNoHorizontalOverflow(page, 375)` in each tool's e2e test: no horizontal scrolling on a phone.
- **axe:** `expectNoA11yViolations(page)`: no WCAG AA violations.
- **Keyboard:** every interactive element reachable and operable by keyboard; visible focus.
- **Screenshots:** `DESIGN_SHOTS=1 npx playwright test design-shots` writes `design-shots/*.png` at 1280 and 375 px for the `lab-design-reviewer` agent. In Windows PowerShell 5 use two commands, one per line:

  ```
  $env:DESIGN_SHOTS=1
  npx playwright test design-shots
  ```

Helpers come from `@whz-ds-labs/lab-kit/testing/e2e`.
