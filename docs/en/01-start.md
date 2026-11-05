# Getting started

This chapter takes you from an empty machine to a first lab running in the browser. The chapters are listed in [the README](../../README.md); the German version of this chapter is [01-start.md](../de/01-start.md).

## Prerequisites

| Tool | Needed version | Check |
|---|---|---|
| Node.js | 24.15 or newer (Node 24 LTS) | `node -v` |
| git | 2.28 or newer | `git --version` |
| GitHub CLI `gh` | any current version, logged in | `gh auth status` |
| uv | any current version | `uv --version` |
| Claude Code | current version | `claude --version` |
| superpowers plugin | installed in Claude Code | see below |

uv runs the Python reference calculations (golden tests). Install the Python version it uses once:

```powershell
uv python install 3.12
```

Install superpowers inside Claude Code (the ds-labs plugin builds on its skills):

```
/plugin install superpowers@claude-plugins-official
```

Alternatively add the superpowers marketplace first (`/plugin marketplace add obra/superpowers-marketplace`) and install `superpowers@superpowers-marketplace`. Restart Claude Code afterwards.

## Install the plugin

Run these two commands in a normal terminal, one after the other:

```powershell
claude plugin marketplace add whz-ds-labs/lab-framework
claude plugin install ds-labs@whz-ds-labs
```

The plugin `ds-labs` brings six skills (`lab-start`, `lab-analyze`, `lab-build`, `lab-design`, `lab-release`, `lab-standards`), three agents (plan reviewer, design reviewer, verifier) and the templates for course repos and labs. Updates arrive with a new plugin version; run `claude plugin update ds-labs@whz-ds-labs` to fetch them.

## Your first lab with Claude

Open Claude Code in an empty working folder and start the guided flow:

```
/ds-labs:lab-start
```

`lab-start` first checks the prerequisites above and names the fix for anything that is missing. It then asks for:

- a course id (lowercase letters, digits and single dashes, starting with a letter, for example `data-science-3`),
- the course title in German and English,
- a topic id for the first lab (same rules, for example `ausgleichsgerade`) and its German and English title.

Nothing is created on GitHub without your explicit approval. After approval it creates the public course repo `whz-ds-labs/<course>` and the private repo `whz-ds-labs/<course>-intern` (course material and planning documents, never public), scaffolds both from the templates and adds the first lab. From there the skill leads through analysis of your material, specification, plan, build and release.

## The same without Claude

Everything `lab-start` scaffolds comes from a dependency-free Node script, so you can do the same by hand. Replace `<plugin>` with the plugin folder (next section):

```powershell
node "<plugin>\scripts\scaffold.mjs" course --dir "C:\work\data-science-3" --course "data-science-3" --title-de "Data Science 3" --title-en "Data Science 3"
node "<plugin>\scripts\scaffold.mjs" intern --dir "C:\work\data-science-3-intern" --course "data-science-3"
node "<plugin>\scripts\scaffold.mjs" lab --dir "C:\work\data-science-3" --topic "ausgleichsgerade" --title-de "Ausgleichsgerade" --title-en "Least squares line"
```

Ids must match `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`. Titles must not contain quotes, backslash, backtick, `$`, `<`, `>`, `{`, `}` or `%`. The script prints the created paths, or exits with one line on stderr and writes nothing. The lab is registered in `site/course.ts` under the name `<camelTopic>Lab`, for example `ausgleichsgeradeLab`.

Then, inside the course folder, one command per line:

```powershell
Set-Location "C:\work\data-science-3"
npm install
npm test
npm run test:py
npx playwright install chromium
npm run test:e2e
npm run build
npm run dev
```

`npm test` runs the unit tests, `npm run test:py` the Python golden tests (needs uv), `npm run test:e2e` the browser tests (needs the Chromium download once), `npm run build` the type check and the production build, `npm run dev` the local site. As long as the first framework release (0.1.0) is not on npm, install your local framework build instead: see [Linking a local framework build](02-architecture.md#linking-a-local-framework-build).

## Where the plugin lives

Claude Code copies an installed plugin into its plugin cache below your user folder. To find the script after installation:

```powershell
Get-ChildItem -Path "$env:USERPROFILE\.claude\plugins" -Recurse -Filter scaffold.mjs | Select-Object -ExpandProperty FullName
```

The folder that contains `scripts\scaffold.mjs` is `<plugin>`. If you work from a clone of the framework repo instead, `<plugin>` is its `plugin` folder.

## Commit the lockfile

`npm install` writes `package-lock.json`. Commit it. The CI of every course repo runs `npm ci`, which refuses to run without a lockfile. The same goes for each lab's `golden/uv.lock`. Never commit course material (slides, notebooks, PDFs, anything under `materials/`) to the public course repo; `npm run guard` fails the build if you do.
