---
name: lab-release
description: Release checklist for a DS Labs course site (CI, guard, design review, roadmap and start page, GitHub Pages deploy). Use when a lab is finished and about to be merged to main and published, or when the user asks to release or deploy a course.
---

# lab-release

Run this before the lab is merged to `main`. Report every item as done, failed or skipped, with evidence. Never push, merge or change repository settings without the user's explicit approval in chat; show the command and wait.

## Checklist

1. **Local gate green.** Dispatch the `lab-verifier` agent if it has not run on the final state. It must report pass for guard, lint:css, type check, unit tests, golden tests, build and e2e.
2. **CI green.** After the user pushes the branch, check `gh run list --branch <branch> --limit 3` and `gh pr checks` (when a PR exists). Do not call anything done on a red or pending run.
3. **Guard.** `npm run guard` passes: no `.ipynb`, no `.pdf`, nothing under `materials/` in the public repo. Also check `git status` for stray files (`.env`, data dumps).
4. **Lockfile.** `package-lock.json` is committed and `npm ci` works from a clean checkout state.
5. **Design review.** Dispatch the `lab-design-reviewer` agent before every release (not per commit). Work in all blocking findings; list the rest for the user.
6. **Roadmap and start page.** `site/course.ts` lists the new lab in `labs` and the remaining ideas in `roadmap` (entries with German and English `title`, optional `note`). The course `README.md` (German and English) names the lab. Everything human-facing exists in both languages.
7. **Python pins.** `golden/uv.lock` is committed for every lab and matches `pyproject.toml` (`uv lock --check --project labs/<topic>/golden`).
8. **Pages setting before the first merge.** In the GitHub repository: Settings > Pages > Build and deployment > Source = **GitHub Actions**. Without it the deploy job fails on the first merge to `main`. Tell the user to set it; check afterwards with `gh api repos/whz-ds-labs/<course>/pages` (404 means Pages is not enabled yet).
9. **Deploy check.** After the merge the `Deploy to GitHub Pages` workflow must succeed (`gh run list --workflow pages.yml --limit 1`). Open the published URL, check that the start page lists the lab, that a scenario link works, and that assets load (a wrong `VITE_BASE` shows as a blank page or 404s for assets).
10. **Versions.** Framework packages `@whz-ds-labs/ui` and `@whz-ds-labs/lab-kit` are pinned to the same exact version; no `^` or `~`.

## When the framework itself is released

Releasing `@whz-ds-labs/lab-kit`, `@whz-ds-labs/ui` and the `ds-labs` plugin (Changesets, Trusted Publishing, plugin version sync) follows the release flow in chapter 4 of the framework handbook. That is a maintainer task in the framework repository, not part of a course release.

## Report

Finish with a short table: item, status, evidence. Name open points and who has to act (usually the user: push, Pages setting, merge).
