---
name: lab-start
description: Entry point of every DS Labs session. Use when the user wants to start a new course site, a new lab (interactive learning tool) for a course, or continue lab work; checks the toolchain, creates the course and intern repos and the lab module from templates, and routes the work through analysis, spec, plan, build and release.
---

# lab-start

Entry point for DS Labs work. Be explicit and brief; ask before anything with side effects on GitHub. Answer in the user's language. Commands you show to the user must work in Windows PowerShell 5: no `&&`, one command per line.

`$ARGUMENTS` may already contain the answers, for example `course=ds3 topic=ausgleichsgerade`. Read what is there and ask only for what is missing.

## Step 1: Gather the facts

Ask once, in one message, for whatever `$ARGUMENTS` did not provide:

- Course id (lowercase letters, digits, single dashes inside; 2-41 characters; starts with a letter), German course title, English course title.
- Topic id (same rules) and German and English topic title. A topic is one lab, for example `ausgleichsgerade`.
- Where the repos live: default is a folder next to the current directory. Reuse existing clones side by side (`<course>` and `<course>-intern`) if they exist.

Titles must not contain quotes, backslash, backtick, `$`, `<`, `>`, `{`, `}` or `%`. If the user gives such characters, ask for a variant without them.

## Step 2: Check prerequisites

Run one command each and report a short pass/fail list. Name the fix for every failure and stop at hard failures.

| Check | Command | Needs | Fix |
|---|---|---|---|
| GitHub login | `gh auth status` | logged in | `gh auth login` |
| Node | `node -v` | 24.15 or newer | install Node 24 LTS from nodejs.org (or `winget install OpenJS.NodeJS.LTS`) |
| uv | `uv --version` | any current version | `winget install --id astral-sh.uv` on Windows; the installer from docs.astral.sh/uv on macOS and Linux |
| superpowers | check the available skills for `superpowers:brainstorming` | installed | see below |

If superpowers is missing, tell the user to run this in Claude Code (verified against the superpowers README):

```
/plugin install superpowers@claude-plugins-official
```

Alternative, from the superpowers marketplace:

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

Then restart the session. Do not continue past this point without superpowers: the flow in step 6 depends on it.

Playwright browsers are installed on demand later (`npx playwright install chromium`), not here.

## Step 3: Repos

Ask before creating anything on GitHub, and show the exact commands first:

```
gh repo create whz-ds-labs/<course> --public
gh repo create whz-ds-labs/<course>-intern --private
```

`<course>` is public and never contains course material. `<course>-intern` is private and holds `materials/` and `docs/`. Never make the intern repo public. If the repos already exist, clone or reuse them side by side. If the user does not want GitHub repos now, work in local folders and say so.

Never push, create or delete repos, or merge without the user's explicit approval in chat.

## Step 4: Scaffold

Skip the parts that already exist. Quote every argument. Create the course repo, the intern repo, then the lab:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" course --dir "<path>/<course>" --course "<course>" --title-de "<German title>" --title-en "<English title>"
node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" intern --dir "<path>/<course>-intern" --course "<course>"
node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" lab --dir "<path>/<course>" --topic "<topic>" --title-de "<German topic title>" --title-en "<English topic title>"
```

The script prints the created paths and exits 1 with one line on stderr when an id or title is invalid (nothing is written then). The lab appears in `site/course.ts` as `<camelTopic>Lab`.

Set the git identity locally in each new repo if none is configured: the user's GitHub noreply address (`<id>+<user>@users.noreply.github.com`), never a private address. Ask for it if you cannot read it from `gh api user`.

## Step 5: Install and smoke test the new course repo

In the course repo, one command at a time:

```
npm install
npm test
npm run build
```

Report what passed and what failed, with the relevant output lines. Tell the user to commit `package-lock.json` (CI runs `npm ci` and fails without it). Do not commit or push on your own.

## Step 6: The flow

Lay out the route and start at the first open stage. Write all documents to `<course>-intern/docs/<topic>/` (never to the public repo).

1. Inventory of the materials in `<course>-intern/materials/` and potential analysis: invoke `lab-analyze`. Result: `potenzialanalyse.md`.
2. `superpowers:brainstorming` on the chosen idea. Result: a spec.
3. `superpowers:writing-plans`. Result: a plan.
4. Plan review: dispatch the `lab-plan-reviewer` agent with the plan and the spec. Work in its findings.
5. `superpowers:subagent-driven-development` to build the lab. Load `lab-build` and `lab-design` before the first tool is written.
6. Gate: dispatch the `lab-verifier` agent.
7. `lab-release`.

Tell the user once that the superpowers skills would by default write specs and plans to `docs/superpowers/` of the current repo; here they must go to `<course>-intern/docs/<topic>/` instead.

## Framework development only

Not offered to end users. When `$ARGUMENTS` contains `packs=<dir>`, the framework is being tested before its first release: forward the directory to the course scaffold as `--packs "<dir>"`, so the course repo installs the local tarballs of `@whz-ds-labs/ui` and `@whz-ds-labs/lab-kit` instead of registry versions:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs" course --dir "<path>/<course>" --course "<course>" --title-de "<German title>" --title-en "<English title>" --packs "<dir>"
```

In that mode the user is a framework developer: skip the GitHub repo step unless asked.
