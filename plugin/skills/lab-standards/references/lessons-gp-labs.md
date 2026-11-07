# Lessons from the Gaussian-process lab

A lab with a playground, a kernel builder and a data lab, later extended with per-tool help and three scenarios per tool.

## Process

Brainstorm, spec, plan, plan review, then subagent implementation with a review per task caught many real errors early: L-BFGS with active bounds, NaN pivots, duplicated math in the UI, scaler on constant columns, German CSV detection, kernel validity affected by rounding. A plan review also found wrong preset parameters (periodic length scale vs warp length scale) and tolerances that scikit-learn could not meet.

## Numerics

- Projected L-BFGS: zero the components of active bounds in the gradient, otherwise the direction degenerates exactly where hyperparameters end up.
- StandardScaler rebuild: set nearly constant scales (sd about 1e-17) to 1 like scikit-learn's `_handle_zeros_in_scale`.
- Judge covariance validity by eigenvalues with a relative threshold, not by Cholesky success.
- German CSV: separator priority `;`, tab, `,`; decimal comma only for values matching `^-?\d+,\d+$`.
- UI must not duplicate formulas. Export cached core objects (for example a `fitModel()` result) and let the view read them.

## Scenarios when views do not write sliders into the URL

- Keep a registry with an address part (`query`) and typed settings. Detect deviation through canonical setting keys (sorted keys, `toPrecision(12)`). Adopt a scenario only if the address matches it (`routeMatchesScenario`).
- A loader with identity protection per route object (`loadOnce`) makes watcher order and double calls harmless.
- Start actions that load asynchronously (data lab, `KeepAlive`): use a generation counter per adoption and re-check it after loading. `adopt` may run in a deactivated `KeepAlive` view, so it changes state only; DOM work belongs in the action.
- With `flush: 'sync'` watchers, `await nextTick()` is not enough: `await Promise.resolve()` first, then `nextTick()`.

## Claims must be proven

- Helper `claim(id, text, actual, digits)` plus a set comparison of all numbers in the German and English texts against `CLAIMED`, in both directions. A text number without a claim fails, a claim without a text number fails.
- Heavy runs (a real dataset fit) go in their own test files: Vitest parallelises per file.

## Working habits

- Never pipe long-running commands through `| grep` or `| head`: output appears only at the end and looks like a hang. Redirect to a file instead.
- Kill leftover vitest processes before measuring; four parallel runs distorted timings badly.
- Reference results to reproduce: textbook values 0.800 / 0.447 / 0.671 (chapter 9) and an RMSE of 0.392 on the notebook's real dataset.
