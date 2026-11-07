# %%course%% course site

Start every session with `/ds-labs:lab-start`. It checks the toolchain (Node >= 24.15, uv, Playwright) and routes the work.

This repo is a public DS Labs course site built on `@whz-ds-labs/ui` and `@whz-ds-labs/lab-kit`. Labs live in `labs/<topic>/` and are registered in `site/course.ts`.

## Hard rules

- Course materials (slides, notebooks, PDFs, anything under `materials/`) exist only in the private repo `%%course%%-intern`, never here. `npm run guard` fails the build otherwise.
- Commit `package-lock.json`. CI runs `npm ci` and fails without it.
- Framework versions are pinned exactly (no `^` or `~`); update `@whz-ds-labs/ui` and `@whz-ds-labs/lab-kit` together to the same version.
- Never push, create or delete repos, or merge without explicit approval from the user in chat.
- Git identity: use the GitHub noreply email (`<id>+<user>@users.noreply.github.com`), never a private address.
- Commit messages and identifiers in English; user-facing text always in German and English.
- Design: no CSS lines as separators, colors only through `--ds-*` tokens (enforced by `npm run lint:css`).
- Every interactive component carries `data-verify-unit` and `data-verify-state` (`loading|empty|ready|error`).
- Commands shown to the user must work in Windows PowerShell 5: no `&&`, one command per line.
- Python golden runs use `uv run --native-tls --locked --project <lab>/golden ...` with exact `==` pins and a committed `uv.lock`.
