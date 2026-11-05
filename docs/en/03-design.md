# Design v0 "Surfaces"

The interim design that applies until the design system v1 is agreed with the professor. v1 will replace tokens and styles, not the interfaces. The German version of this chapter is [03-design.md](../de/03-design.md).

## The rules

The main idea: structure comes from **surfaces and spacing**, never from lines.

1. No CSS lines as separators: no `border-top/-bottom/-left/-right`, no visible `border` shorthand, no `<hr>` styles in layout CSS.
2. At most three surface levels: page, area, card. A card sits on an area, an area on the page.
3. One accent colour for the primary action and the current selection. Status colours only for status.
4. Colours only through `--ds-*` tokens with `var()`. No hex, `rgb()`, `hsl()` or named colours in lab code.
5. Clear hierarchy: title, then controls, then result.
6. Click targets of at least 40 px.
7. Class colours always come with a marker shape, so colour-blind learners can tell classes apart.
8. Borders only on input fields and focus rings.
9. The states `loading`, `empty`, `error` and `ready` look visibly different (component `StatusPanel`).
10. Light and dark follow `prefers-color-scheme` and come from the tokens; never hard-code a theme.

## Tokens

Import `@whz-ds-labs/ui/tokens.css` once (the course shell already does). Raw colour values exist only in this file.

| Group | Tokens |
|---|---|
| Surfaces | `--ds-surface-page`, `--ds-surface-area`, `--ds-surface-card` |
| Text | `--ds-text`, `--ds-text-muted` |
| Accent | `--ds-accent`, `--ds-accent-contrast`, `--ds-focus` |
| Status | `--ds-ok`, `--ds-warn`, `--ds-error`, `--ds-error-bg` |
| Input | `--ds-input-border` |
| Plot | `--ds-plot-axis`, `--ds-plot-grid`, `--ds-points` |
| Classes | `--ds-class-0` to `--ds-class-5` |
| Space | `--ds-space-1` to `--ds-space-7` |
| Radius | `--ds-radius-s`, `--ds-radius-m`, `--ds-radius-l`, `--ds-radius-pill` |
| Type | `--ds-font-s`, `--ds-font-m`, `--ds-font-l`, `--ds-font-xl`, `--ds-weight-regular`, `--ds-weight-strong` |
| Target size | `--ds-hit` |

Read the current values from `node_modules/@whz-ds-labs/ui/tokens.css`; do not copy them into lab code. The class colours follow the Okabe-Ito palette and are colour-blind safe.

## Automatic checks

| Check | Command | What it finds |
|---|---|---|
| stylelint `ds-labs/no-separator-lines` | `npm run lint:css` | `border-*` with a visible line, `hr` selectors |
| stylelint `ds-labs/color-tokens-only` | `npm run lint:css` | hex, `rgb()`, `hsl()` and similar colour literals |
| 375 px | `expectNoHorizontalOverflow(page, 375)` in each tool's e2e test | horizontal scrolling on a phone |
| axe | `expectNoA11yViolations(page)` in each tool's e2e test | WCAG AA violations |
| keyboard | e2e test of the tool | elements that cannot be reached or operated by keyboard, missing focus ring |

The helpers come from `@whz-ds-labs/lab-kit/testing/e2e`. SVG plot lines (axes, grid, data lines) use `stroke` with `--ds-plot-*` tokens; they are not CSS borders and are fine.

## The design reviewer

The agent `lab-design-reviewer` looks at screenshots of every tool and scenario at 1280 px and 375 px and checks the list above: no lines, at most three surface levels, one accent colour, clear hierarchy, targets of at least 40 px, distinguishable states. It runs before every release (skill `lab-release`), not per commit. Create the screenshots in the course repo, one command per line:

```powershell
$env:DESIGN_SHOTS="1"
npx playwright test design-shots
```

The images land in `design-shots/`. Blocking findings must be fixed before a release; the rest goes on a list for the maintainers.

## Allowed exceptions

A justified exception is a comment **directly above the declaration**, with a reason:

```css
/* ds-labs-allow: input border keeps the field recognisable */
border: 1px solid var(--ds-input-border);
```

An allow comment without a reason is itself reported. The exception is meant for input fields. If you feel you need it for layout, change the layout. Outlines and focus rings (`--ds-focus`) are always allowed and must never be removed.
