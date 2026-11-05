# Git and course materials

## Materials never enter a public repo

- Notebooks (`*.ipynb`), PDFs, slides, textbook text, and anything under a `materials/` directory stay out of git. The only exception is the template file `materials/README.md` of the internal course layout.
- The guard (`npm run guard`) fails when such files are tracked, and CI runs it first. Never weaken it to get a build through.
- Refer to material as text only: "textbook ch. 9, notebook cell 39". Do not paste passages or figures.
- Open datasets (UCI, CC BY 4.0) ship with source and licence. Datasets with redistribution limits are loaded by the learner, not committed.
- Specs, plans and course analyses live outside the repo or under an ignored folder.

## Identity

- Commit with the GitHub noreply address, set locally in the repo (`git config user.email <id>+<login>@users.noreply.github.com`). A private mail address in history is permanent once pushed.
- Check before the first push: `git log --format="%an <%ae>%n%cn <%ce>" | sort -u` must list only the noreply address.

## No push without approval

Never push, create or delete a repo, or merge without the user's explicit approval in chat, even when asked earlier for something nearby. Prepare the branch, show the commits, and ask.

## History without internals

If internal notes, private addresses or materials reached local history, rewrite it **before the first push**:

1. Make a bundle backup outside the repo (`git bundle create ../backup.bundle --all`).
2. Rewrite with `git filter-repo` (remove paths, replace mail addresses via a mailmap) or, for a short history, rebuild it as a clean series of commits.
3. Verify: search the whole history for the paths, names and addresses, then run the guard.
4. Only then ask for approval to push.

## Commits

English messages in conventional style (`feat(scope): ...`). One logical change per commit. No secrets, no `.env` files except `.env.example`.

## Deploy

GitHub Pages must be switched to "GitHub Actions" once in the repo settings before the first deploy. The base path comes from `VITE_BASE`, never hard-coded.
