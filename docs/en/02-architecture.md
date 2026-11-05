# Architecture

What the framework consists of, how a course repo uses it and how a tool talks to the address bar. The German version of this chapter is [02-architecture.md](../de/02-architecture.md).

## Packages and dependency direction

The framework repo `whz-ds-labs/lab-framework` is an npm workspaces monorepo with three parts that always share one version:

| Part | Content |
|---|---|
| `@whz-ds-labs/lab-kit` | Logic without its own interface: `defineLab`/`defineTool`/`defineCourse`, hash router and URL state, scenarios, DE/EN texts, worker client, seeded random numbers, CSV import, verify attributes, test helpers, stylelint plugin |
| `@whz-ds-labs/ui` | Vue components and CSS: design tokens, `LabShell`, `createCourseApp`, sliders, plot pieces, help drawer, `StatusPanel`, `Formula` |
| `ds-labs` (folder `plugin`) | Claude plugin with skills, agents, templates and the scaffold script |

The dependency direction is one-way: a course repo depends on `ui` and `lab-kit`; `ui` depends on `lab-kit` with the exact same version; `lab-kit` depends on neither. `vue` is a peer dependency of both packages, `katex` and `d3-scale` additionally of `ui`. Because all versions are exact, npm installs one copy of each. A second copy of `vue` would break `provide`/`inject` and reactivity, so the module state of lab-kit additionally lives in one object under a global symbol and survives a duplicate copy.

## Entry points

| Package | Import | Use |
|---|---|---|
| `@whz-ds-labs/lab-kit` | `.` | definitions, router, i18n, scenarios, helpers |
| | `/worker` | job client for background calculations (importable without a DOM) |
| | `/testing` | unit-test helpers: load golden JSON and compare with a relative tolerance |
| | `/testing/e2e` | Playwright helpers: verify states, 375 px overflow check, axe |
| | `/stylelint` | stylelint plugin with the two design rules |
| | `/stylelint/config` | ready-made stylelint configuration |
| `@whz-ds-labs/ui` | `.` | components and `createCourseApp` |
| | `/tokens.css` | design tokens |
| | `/style.css` | base styles of the components |

`/worker`, `/testing` and `/stylelint*` import in plain Node, without a DOM. Both packages are ESM only.

## Course, lab and tool

- A **course** (`defineCourse`) has an id, titles, a lead text, a list of labs and a roadmap of ideas that are still to come. It lives in `site/course.ts`.
- A **lab** (`defineLab`) is one topic: id, titles, summary, its tools and its message catalogs for German and English.
- A **tool** (`defineTool`) is one interactive view inside a lab: id, titles, summary, the Vue component, `parse` and `toQuery` for its state, scenarios and help topics.

Ids match `^[a-z][a-z0-9-]{1,40}$`. A wrong definition fails at start-up with a `BAD_DEFINITION` error that names the reason. `createCourseApp(course)` from `@whz-ds-labs/ui` turns the course into the Vue app with header, tool pills, help drawer, language button, course page and lab page.

## The tool contract

A tool is an independent Vue component that knows neither router nor URL:

- prop `state` with the typed state, prop `labId`;
- event `update:state` with the complete next state (replace it, never mutate it);
- optionally `defineExpose({ runAction(name) })`, called exactly once when a scenario with an `action` is applied.

`parse(query)` never throws: every correction adds the parameter name to `problems`, and the shell shows a notice about the corrected address. `toQuery(state)` omits parameters that equal their default. An adapter in lab-kit couples the state to the URL, so the same component can later be embedded in a page of a learning site. Every interactive component carries the verify attributes `data-verify-unit`, `data-verify-state` (`loading`, `empty`, `ready` or `error`), optionally `data-verify-count`, and `data-verify-error` in the error state.

## URL scheme

The site uses hash routes, so it works on GitHub Pages without server rules:

```
#/<lab>/<tool>?<parameters>&scenario=<id>&lang=<de|en>
```

- `<lab>` and `<tool>` are the ids from the definitions.
- `<parameters>` are the tool's own, short and stable parameter names.
- `scenario=<id>` marks a ready-made state. As soon as the learner changes a parameter so that the state differs from the scenario, the parameter disappears again.
- `lang` selects the interface language.

A link with a scenario is a stable teaching link: it sets all parameters and may run a one-off action, for example a bootstrap.

## Message keys

- Every text exists in German and English. A missing key shows the key itself, and the completeness test fails if a key exists in only one language.
- `t()` from `useI18n()` without a scope always takes **full keys**: `kit.…` for framework texts and `<labId>.…` for lab texts. Framework components use full `kit.*` keys, and notices store full keys.
- The lab catalog is registered under the lab id, so its keys are written relative to that scope in `i18n/de.ts` and `i18n/en.ts` (`line.plot.title` becomes `<labId>.line.plot.title`). `useI18n(scope)` is a convenience for lab code only.
- Help texts live at `<toolId>.help.read.<key>` and `<toolId>.help.controls.<key>`.

## Course repo layout

```
<course>/
  site/                  course start page (course.ts, main.ts)
  labs/<topic>/
    core/                subject maths, framework free
    tools/               tools as Vue components, state parsing
    worker/              background jobs
    scenarios.ts, help/, i18n/
    golden/              make_golden.py, pyproject.toml, uv.lock
    tests/               unit, golden JSON, e2e
  scripts/               guard, changed-labs, run-golden
  .github/workflows/     CI and GitHub Pages deploy
```

The private repo `<course>-intern` sits next to it and holds `materials/` (slides, notebooks) and `docs/<topic>/` (analyses, specifications, plans). Python versions are pinned per lab, because notebooks of different topics use different environments. The Pages deploy builds with `VITE_BASE=/<repository name>/`.

## Linking a local framework build

When you change the framework and want to see the effect in a course repo before a release, run this in the framework repo (one command, with the course folder as argument):

```powershell
node scripts/link-local.mjs "C:\work\data-science-3"
```

The script builds both packages, packs them into `.local-packs/` and runs `npm install --no-save` with both tarballs together in the course repo. At the end it prints `npm ls @whz-ds-labs/ui @whz-ds-labs/lab-kit vue` and fails if more than one copy of `vue` or `@whz-ds-labs/lab-kit` is installed.

- No symlinks or junctions, so it works on Windows without administrator rights.
- `package.json` and `package-lock.json` of the course repo stay unchanged, so nothing un-committable can be committed by accident.
- The installed files are the same tarballs CI uses, so "works locally" means "works in CI".
- **Undo** with `npm ci` in the course repo.
- **Limit:** every later `npm install <x>`, `npm uninstall`, `npm ci` or Renovate update re-aligns the tree with the registry and silently drops the linked tarballs. Run `link-local.mjs` again after such a command. If npm reports `EINTEGRITY` for an identical version, run `npm ci` first and link again.
- **Why not `npm link`?** It creates junctions to the framework workspace, whose own `node_modules/vue` is then loaded as a second Vue copy, and every course repo would need `resolve.dedupe` tweaks. The price of the chosen method is a re-run of about 15 seconds after each framework change.
