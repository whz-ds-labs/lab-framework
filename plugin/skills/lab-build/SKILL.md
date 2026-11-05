---
name: lab-build
description: Guardrails for building a DS Labs lab (core, tools, scenarios, help, golden tests, worker). Use while implementing or changing anything under labs/<topic>/ in a course repo, alongside the superpowers skills; states the tool contract, URL state, scenario, help, verify and golden-test rules.
---

# lab-build

Lab-specific rules that sit on top of the superpowers skills (`superpowers:test-driven-development`, `superpowers:subagent-driven-development`). Follow them for every file under `labs/<topic>/`. For design rules load `lab-design`. For numerical pitfalls, golden tolerances, Windows and git details load the references of `lab-standards`, when that skill is available.

## Layout of a lab

```
labs/<topic>/
  lab.ts                  defineLab({ id, title, summary, tools, messages })
  core/                   pure TypeScript, no Vue, no DOM
  worker/                 client.ts, jobs.ts, <x>.worker.ts
  tools/                  <tool>.ts (defineTool), <Tool>.vue, state.ts
  scenarios.ts            ScenarioDef[] per tool
  help/topics.ts          HelpTopics per tool
  i18n/{de,en}.ts         every message in both languages
  golden/                 pyproject.toml, uv.lock, make_golden.py, test_golden.py
  tests/{golden/*.json, unit/*.test.ts, e2e/*.spec.ts}
```

## Guardrails checklist

Tick every line before a tool counts as done.

- [ ] **Golden tests against Python are mandatory.** Every numerical result the learner sees is produced by `core/` and compared with a JSON file written by `golden/make_golden.py` from the reference library (scikit-learn, scipy, numpy, ...). No golden, no tool.
- [ ] **The core is framework-free.** `core/` imports no Vue, no DOM, no `@whz-ds-labs/ui`. It can run in Node, in a worker and in tests.
- [ ] **Anything above about 50 ms runs in a worker.** Worker code imports only `@whz-ds-labs/lab-kit/worker`. The `new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' })` call lives in the lab (`worker/client.ts`), never in the framework. Results carry a `runId`; a new run terminates the old worker (cancel by terminating).
- [ ] **Two to three scenarios per tool, help for every tool.** See the rules below.
- [ ] **Verify contracts on every interactive component.** `data-verify-unit`, `data-verify-state` in `loading|empty|ready|error`, `data-verify-count` where it makes sense, `data-verify-error` when in `error`. Use `verifyAttrs()` from `@whz-ds-labs/lab-kit`.
- [ ] **A tie oracle for every algorithm with choices.** If equal candidates can occur (equal gain, equal distance, equal rank, argmax over equal values), the reference library's tie-break is the specification. Write a golden case with an exact tie, record which candidate Python picks, and implement the same rule. Never rely on floating-point luck: compare with the tolerance of the golden test and make ties exact in the test data.
- [ ] **Python pins come from the course environment.** The versions in `golden/pyproject.toml` are exact `==` pins taken from the environment the course itself uses (its requirements or lock file), not whatever is newest. After editing a pin run `uv lock --project labs/<topic>/golden` and commit `uv.lock`. Python 3.12 (`uv python install 3.12` where missing).
- [ ] **Every interactive element is keyboard reachable** (WCAG 2.1.1): buttons, sliders, point placement, scenario links, help. A feature that works only by mouse is a bug.
- [ ] **All text in German and English.** The i18n completeness test must pass.

## Tool contract

A tool is a standalone Vue component. It knows no router and no URL.

- Props: `state` (the tool's state object) and `labId` (string).
- Emits: `update:state` with a **new object** each time (never mutate the prop).
- Optional `defineExpose({ runAction })` for scenario start actions (for example `'bootstrap'`). `runAction(name)` must be safe to call once on arrival.
- Registered with `defineTool({ id, title, summary, component, parse, toQuery, scenarios, help, refs? })`.

## URL state rules

- `parse(query)` never throws. Every corrected or rejected value adds the parameter name to `problems` (the UI shows a notice), and the state is always valid.
- `toQuery(state)` omits every parameter that equals its default, so the default URL is clean.
- Round trip: `parse(toQuery(s)).state` equals `s` for every valid state. Test it.
- Route shape: `#/<lab>/<tool>?…`. The adapter from lab-kit writes the query; the tool never touches `location` or `history`.

## Scenario rules

- Two to three scenarios per tool. Each is a state the learner could not easily find alone: an edge case, a trap, a comparison.
- A scenario is `{ id, query, action? }`. `query` is the **complete normalised query** (defaults omitted). Links built from a scenario carry the full query; a bare `?scenario=id` only marks the scenario active.
- Texts per scenario live under `scenario.<id>.{title,short,see,watch,next}` in both languages.
- **Every number in a scenario text must be proven by a test.** `tests/unit/scenarioClaims.test.ts` computes each claimed value from `core/` (and from the golden JSON where possible) and compares it with the number in the text. Change a text number without changing its test and the suite fails. Use the minus sign U+2212 in text when the claims check expects it.

## Help topics and message keys

- `help/topics.ts` exports `HelpTopics`: `read` entries (what the plot and results mean) and `controls` entries (what each control does).
- Keys: `<toolId>.help.purpose`, `<toolId>.help.read.<key>`, `<toolId>.help.controls.<key>`. The `title` and `label` fields in `topics.ts` are message keys **relative to the lab scope** (for example `line.plot.title`), or `{ literal: '…' }` for a verbatim label.
- `t()` without a scope takes full keys (`kit.…`, `<labId>.…`); `useI18n(scope)` is a convenience for lab code only. Framework components use full `kit.*` keys.
- Numbers and dates are formatted with `fmt` and the formatters from lab-kit, per language (decimal comma in German).

## Tests

- **Unit** (`tests/unit/*.test.ts`, Vitest): core functions, state parse/toQuery round trip, scenario claims, message completeness (`catalogParity`, `missingLabMessages` from `@whz-ds-labs/lab-kit/testing`).
- **Golden** (`tests/unit/golden.test.ts`): locate files with `join(dirname(fileURLToPath(import.meta.url)), '..', 'golden')`. Do not use a bare `new URL('../golden', import.meta.url)`: Vite rewrites `new URL(rel, import.meta.url)` under happy-dom. Load with `loadGolden(dir, name)` and compare with `expectClose(actual, expected, { rtol, atol })`; choose `rtol`/`atol` per quantity and say why in a comment.
- **Python side** (`golden/test_golden.py`, pytest): recomputes every case with the pinned library and compares with the stored JSON (`assert_allclose`). `make_golden.py` and the tests use paths relative to their own file and run with cwd = the golden folder. Regenerate with `npm run golden`, check with `npm run test:py`. Write JSON with LF line endings on every platform.
- **e2e** (`tests/e2e/*.spec.ts`, Playwright): verify state reaches `ready` (`expectVerifyState`), no horizontal overflow at 375 px (`expectNoHorizontalOverflow`), no axe violations at WCAG AA (`expectNoA11yViolations`), scenario links produce the described state. Helpers: `@whz-ds-labs/lab-kit/testing/e2e`.

## Worker pattern

`worker/jobs.ts` holds the pure job function (shared by worker and unit tests). `worker/<x>.worker.ts` calls `serveJobs` from `@whz-ds-labs/lab-kit/worker`. `worker/client.ts` calls `createJobClient(() => new Worker(new URL('./x.worker.ts', import.meta.url), { type: 'module' }))`. The tool starts a job, shows `loading` while it runs, ignores results of outdated `runId`s, and shows `error` with `data-verify-error` when the job fails.

## Commands

```
npm test              unit and golden tests of all labs
npm run test:py       uv golden per lab
npm run golden        regenerate golden JSON (then review the diff)
npm run test:e2e      Playwright
npm run lint:css      design rules
npm run guard         no materials in this repo
npm run build         type check and production build
npm run changed-labs  labs affected by the current diff
```

## Never

- Course material (slides, notebooks, PDFs, anything from `materials/`) in the public repo. The guard fails the build.
- A private email address in git; use the GitHub noreply address.
- Push, repo creation or merge without the user's explicit approval in chat.
- Secrets in code, commits or logs.
