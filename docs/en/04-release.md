# Release

How a new framework version reaches npm and the plugin cache. This chapter is for maintainers of the framework repo; a course release is covered by the skill `lab-release`. The German version of this chapter is [04-release.md](../de/04-release.md).

## One version for everything

`@whz-ds-labs/lab-kit`, `@whz-ds-labs/ui` and the plugin `ds-labs` share one version (a Changesets `fixed` group). "Framework 0.3.0" therefore always means one definite state. `npm run check:versions` fails if `plugin/package.json`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` and the two packages differ. The plugin also needs the bump: Claude Code only fetches an update when the version number changes.

## Changesets in daily work

Every change that should reach users gets a small description file next to the code:

```powershell
npx changeset
```

Choose the packages and the level (`patch`, `minor`, `major`) and write one sentence. Commit the generated file in `.changeset/` together with the change. Because of the fixed group all three parts get the same new version, whatever you choose.

## From merge to npm

The workflow `release.yml` runs on every push to `main`:

1. It first calls the full CI (`ci.yml`): guard, version check, build, type check, lint, tests and the integration run. The "Version Packages" pull request is created with the built-in token and therefore triggers no CI run of its own, so the release re-runs the checks itself.
2. The Changesets action opens or updates the pull request **Version Packages**. It raises all versions, writes the changelogs and syncs the plugin manifests and the lockfile (`npm run version`).
3. You review that pull request and merge it. This merge is the release decision.
4. On the following run no pending changesets exist, so `node scripts/publish.mjs` publishes `@whz-ds-labs/lab-kit`, then `@whz-ds-labs/ui` (npm Trusted Publishing with provenance) and finally creates and pushes the tag `v<version>`. The script is safe to repeat: versions that already exist on npm and existing tags are skipped.

Because the "Version Packages" pull request gets no CI run of its own, a branch protection rule that requires status checks would block its merge. The release workflow re-runs the full CI before it publishes, so maintainers either merge that pull request without the required checks (for example as an administrator) or re-trigger CI on it by closing and reopening the pull request.

**Template changes and unreleased APIs.** The plugin marketplace entry points at `./plugin` on `main`, so a change to the course template reaches new installs as soon as it is merged, long before the next npm release. A template change that needs package APIs which are not yet published therefore merges only together with the release that publishes them: one pull request containing the change, the template update and the changeset.

No npm token is stored anywhere. Publishing works through a short-lived identity token (OIDC) from GitHub Actions, with Node 24 and npm 11.5.1 or newer.

## One-time setup

Do this once, before the first real release. Reason: npm accepts a Trusted Publisher only for packages that already exist, so each package needs a manual placeholder with version `0.0.0`.

**1. Create the placeholders.** In the framework repo, one command per line:

```powershell
node scripts/placeholder.mjs "$env:TEMP\ds-labs-placeholders"
npm login
```

The first command writes the two placeholder packages and prints the commands for step 2. `npm login` asks for your login (with security key, if set up).

**2. Publish the placeholders.** For each of the two folders `lab-kit` and `ui` below the output folder:

```powershell
Set-Location "$env:TEMP\ds-labs-placeholders\lab-kit"
npm publish --access public
Set-Location "$env:TEMP\ds-labs-placeholders\ui"
npm publish --access public
```

**3. Enter the Trusted Publisher** on npmjs.com for each package (package page, Settings, Trusted Publisher, GitHub Actions):

| Field | Value |
|---|---|
| Organization or user | `whz-ds-labs` |
| Repository | `lab-framework` |
| Workflow filename | `release.yml` |
| Environment | leave empty |

**4. Allow pull requests from Actions.** In the GitHub repo: Settings, Actions, General, Workflow permissions, tick **Allow GitHub Actions to create and approve pull requests**. Without it the Changesets action cannot open the "Version Packages" pull request. In a **new organization** this must first be allowed at organization level (organization Settings, Actions, General, Workflow permissions); the repository setting stays greyed out until then.

The first real release is then `0.1.0`. If the first publish fails during authentication, see the comment in `release.yml` about `registry-url` and `NODE_AUTH_TOKEN`.

## Renovate in course repos

Every course repo contains a `renovate.json` that groups all `@whz-ds-labs/*` packages into one pull request and pins exact versions. For it to do anything, the **Renovate app must be installed in the GitHub organization** `whz-ds-labs` and given access to the course repos (Organization settings, GitHub Apps). The course CI then tests every update pull request, and the course maintainers decide when to merge it. After merging such an update locally, link a local build again if you were using one (see [Linking a local framework build](02-architecture.md#linking-a-local-framework-build)).
