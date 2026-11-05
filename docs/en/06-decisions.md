# Decisions

The decisions behind DS Labs with their reasons and the alternatives that were rejected. Read them before you change the foundations. The German version of this chapter is [06-decisions.md](../de/06-decisions.md).

## Overall concept (E1 to E8)

| # | Decision | Reason | Rejected |
|---|---|---|---|
| E1 | GitHub organization **`whz-ds-labs`** on github.com; the author is the only owner at first | Handover by swapping owners, without changing any address; an organization can be created at once under a private account | Repos under a personal account (a transfer changes the addresses); WHZ GitHub Enterprise now (organizations only via the IT service, Pages availability unclear) |
| E2 | **One framework repo plus one repo per course** | Courses can belong to different professors; the course is the natural unit of maintenance | One monorepo for everything (permissions cannot be separated); one repo per lab (about 40 repos) |
| E3 | Shared code as **versioned npm packages** `@whz-ds-labs/ui` and `@whz-ds-labs/lab-kit`, public on npmjs.com; published only by CI; updates by Renovate pull requests | Traceable versions, courses decide for themselves when to update, install without a login | Git dependency or submodule (clumsy, ties to git addresses); copy plus sync command (drift) |
| E4 | **One private intern repo per course** (`<course>-intern`) for course material and planning documents | Material must not be public but must move along at handover; access can be separated per course | One intern repo for all courses; local or cloud storage as before |
| E5 | **Labs as modules of a course repo**; every tool is a self-contained Vue component driven by props and events; URL coupling is a replaceable adapter | One Pages site per course today, embedding into learning sites later without a rebuild | One app per lab |
| E6 | **Claude plugin in the framework repo** with its own skills, agents, templates and knowledge references; requires the public plugin *superpowers* | Independent of any account or machine; successors need no private setup | Knowledge only in a private wiki; skills only under the user's Claude folder |
| E7 | **Order:** framework v0.1, then a pilot lab (ensemble learning), then moving the existing lab collections of the DS2 and DS3 courses, then design system v1 with the professor | Design needs the professor's time; the pilot tests the framework unbiased; moving is mechanics afterwards | Design first; moving before the pilot |
| E8 | **Design v0 now, v1 later:** until agreed with the professor, an interim version applies with the rule "no lines as separators, structure through spacing and surfaces"; v1 replaces only tokens and styles, not the interfaces | Implement part of the professor's feedback without waiting, accept the later design without a rebuild | Postponing the design completely |

## Framework v0.1 (F1 to F10)

| # | Decision | Reason |
|---|---|---|
| F1 | npm workspaces (no pnpm, no turbo) | One tool less for successors |
| F2 | Changesets with a **fixed shared version** for `ui`, `lab-kit` and the plugin | "Framework 0.3.0" is unambiguous; no mixed states |
| F3 | Node 24 LTS (includes npm 11) | Trusted Publishing needs npm 11.5.1 or newer |
| F4 | Publishing only from GitHub Actions via Trusted Publishing with provenance; one manual placeholder `0.0.0` per package | npm allows a Trusted Publisher only for existing packages |
| F5 | Design v0 "Surfaces": structure through grey surfaces, spacing and pill navigation; no separator lines | The professor found the old design restless with many horizontal lines; variant B won the mockup comparison |
| F6 | Design rules are checked automatically (stylelint, e2e) plus a design reviewer agent before releases | Rules alone erode unnoticed |
| F7 | Code is **extracted** from the existing lab collection, not rewritten; the old collection stays unchanged until its own migration | Proven, tested code; migration is a separate project |
| F8 | German and English throughout (labs, handbook, course repos) | Labs, handbook and course repos must be usable in both languages |
| F9 | The plugin is self-contained; its only requirement is the public plugin `superpowers` | Portable to other accounts, professors and colleagues |
| F10 | MIT license, copyright "whz-ds-labs contributors" | Same as the earlier lab collections; an organization instead of a person |

## Decision on the local framework link

**Method: pack and install without saving.** `node scripts/link-local.mjs <course-dir>` builds both packages, packs them into `.local-packs/` and runs `npm install --no-save <ui.tgz> <lab-kit.tgz>` inside the course repo (both tarballs always together). It prints `npm ls @whz-ds-labs/ui @whz-ds-labs/lab-kit vue` and fails if more than one copy of `vue` or `@whz-ds-labs/lab-kit` is installed. Undo with `npm ci`.

Reasons:

- It works on Windows without administrator rights, because it uses no symlinks or junctions.
- `package.json` and `package-lock.json` of the course repo do not change, so nothing un-committable can be committed by accident.
- It is identical to the CI integration path (tarballs), so "works locally" means "works in CI".

Known limit: every later `npm install <x>`, `npm uninstall`, `npm ci` or Renovate update drops the linked tarballs again; run the script once more. The usage is described in [chapter 2](02-architecture.md#linking-a-local-framework-build).

Rejected: `npm link` and `file:` directory dependencies. They create junctions to the framework workspace, whose own `node_modules/vue` then loads as a second Vue copy (broken `provide`/`inject`, reactivity and i18n singletons across packages) and each course repo would need `resolve.dedupe` tweaks. The cost of the chosen method is a re-run of about 15 seconds after each framework change.
