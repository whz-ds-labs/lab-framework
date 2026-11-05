# Windows and PowerShell

Commands shown to the user must work in Windows PowerShell 5.

## Shell syntax

- No `&&` or `||` between commands in PowerShell 5: give one command per line.
- No `export VAR=...`; use `$env:VAR = "value"` for the session.
- Quote every path that can contain spaces. Use forward slashes in arguments to Node and npm.
- Do not pipe long runs through `| grep` or `| head`: output appears only at the end. Redirect to a file and read it.

## Servers and Playwright

- Use `127.0.0.1` instead of `localhost` in URLs and configs. `localhost` can resolve to `::1` first while the dev server listens only on IPv4.
- Run Playwright with **one worker** (`workers: 1`) on Windows; parallel browsers with a dev server cause flaky timeouts.
- Kill leftover `node`, `vitest` and browser processes before timing measurements.

## uv behind HTTPS inspection

On networks or machines that scan HTTPS traffic, `uv` fails with certificate errors. Add `--native-tls` to every `uv run`, `uv lock`, `uv sync` and `uv python install`. Python golden commands read `uv run --native-tls --locked --project <lab>/golden ...`.

## File locks

- Deleting `node_modules` or a temp folder can fail with `EBUSY` or `EPERM` because antivirus or an indexer holds a file. Use `rmSync(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })` in scripts and tests.
- Do not delete a folder that another process uses as working directory.

## Line endings

`.gitattributes` has `* text=auto eol=lf`, so snapshots, templates and placeholders are byte-stable. Generated JSON is written with LF.

## Local framework link

`node scripts/link-local.mjs <course-dir>` packs both framework packages and installs them with `npm install --no-save`. Any later `npm install`, `npm uninstall`, `npm ci` or dependency update in the course repo drops the link silently: run the script again. If npm reports `EINTEGRITY` for an identical version, run `npm ci` first and link again.
