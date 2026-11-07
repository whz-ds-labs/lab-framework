# Handover checklist

Everything a successor needs so that DS Labs keeps running without the original author. Work through the list with the new owner and tick it off. The German version of this chapter is [05-handover.md](../de/05-handover.md).

## People and accounts

- [ ] A **second owner** in the GitHub organization `whz-ds-labs` (Organization settings, People, role Owner). The new owner confirms access to every repo.
- [ ] A **second owner** in the npm organization `whz-ds-labs` (role Owner), with two-factor authentication or a security key.
- [ ] The contact **e-mail addresses** of both organizations, the npm account and the GitHub accounts point to addresses that outlive a single person (role or team address of the department). Commits use the GitHub noreply address, never a private one.
- [ ] Recovery options for both accounts (recovery codes, second factor) are stored with the new owner.

## Repositories and settings

- [ ] List of repos: `lab-framework` (public), one public repo `<course>` and one private repo `<course>-intern` for each course. The intern repos stay private and move with the owner role.
- [ ] **Pages** in every public course repo: Settings, Pages, Source = **GitHub Actions**. The published address works after the first deploy of `pages.yml`, which starts once the CI run on `main` has succeeded.
- [ ] Settings in `lab-framework`: Actions may create and approve pull requests; branch protection on `main` as agreed; the Renovate app is installed in the organization with access to all course repos.
- [ ] Every course repo builds green in CI (`gh run list --limit 3`), and its `package-lock.json` and `golden/uv.lock` files are committed.
- [ ] Course material lives only in the `-intern` repos. `npm run guard` passes in every public repo.

## Publishing

- [ ] The npm packages `@whz-ds-labs/lab-kit` and `@whz-ds-labs/ui` exist, and each has a **Trusted Publisher** entry: organization `whz-ds-labs`, repository `lab-framework`, workflow `release.yml`, environment empty. The new owner has looked at both entries.
- [ ] The new owner knows the release flow of [chapter 4](04-release.md) and has performed one test release (a `patch` changeset, merge of the "Version Packages" pull request).
- [ ] The Claude plugin installs on the new owner's machine from scratch ([chapter 1](01-start.md)).

## Later move to WHZ GitHub Enterprise Server

Moving a repo keeps history, branches and tags when you mirror it. Issues, pull requests, settings, secrets, Pages and Actions variables do **not** travel and must be recreated. Per repo, with an empty target repo already created on the new server (one command per line):

```powershell
git clone --mirror https://github.com/whz-ds-labs/<repo>.git
Set-Location "<repo>.git"
git push --mirror https://<new-server>/<new-org>/<repo>.git
```

Afterwards check these points:

- [ ] Package URLs in `package.json` (`repository.url`), the marketplace entry and the plugin manifest point to the new address. This needs a new release.
- [ ] **Trusted Publishing is tied to github.com.** If the framework repo moves, check first whether npm supports your new server; otherwise keep `lab-framework` on github.com or switch the release to a token-based flow.
- [ ] Course repos get their own Pages setting and a new base path. The deploy takes it from the repository name (`VITE_BASE`), so no code changes are needed, but links that were published elsewhere must be updated.
- [ ] Renovate and the CI runners must be available on the new server; adjust the workflows if marketplace actions are not allowed there.
- [ ] After the move the old repos are archived, not deleted, until everything has been checked.
