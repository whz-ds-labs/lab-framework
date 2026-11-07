---
name: lab-standards
description: Knowledge references for building DS Labs labs - golden tests against Python, lessons from the DT and GP labs, git and materials rules, Windows PowerShell pitfalls, Claude plugin notes. Use while writing or reviewing golden tests, numerics, scenarios, release steps or plugin skills, and whenever lab-build points here.
---

# lab-standards

An index of short reference files. Read only the ones the current task needs; each is self-contained.

| Reference | Read it when |
| --- | --- |
| [golden-tests](references/golden-tests.md) | You write or change `golden/make_golden.py`, `golden/test_golden.py`, `tests/unit/golden.test.ts`, choose tolerances, or the reference library has ties or randomness. |
| [lessons-dt-labs](references/lessons-dt-labs.md) | You re-implement a scikit-learn algorithm (trees, ensembles, pruning) bit-exactly, or plan a lab with many tools and a plan review. |
| [lessons-gp-labs](references/lessons-gp-labs.md) | You write scenarios, async start actions, number-claim tests, or numerics with optimizers, kernels and CSV import. |
| [git-and-materials](references/git-and-materials.md) | You commit, prepare a first push, or touch anything that could be course material. |
| [windows-powershell](references/windows-powershell.md) | You give the user commands, run Playwright, uv or npm on Windows, or hit file-lock errors. |
| [claude-plugin-notes](references/claude-plugin-notes.md) | You edit the plugin itself: skills, versions, `${CLAUDE_PLUGIN_ROOT}`, `$ARGUMENTS`, or test skills with `claude -p`. |
