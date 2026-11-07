# %%courseTitleDe%% / %%courseTitleEn%%

Course id: %%course%%

## Deutsch

Diese Website sammelt die interaktiven Lernwerkzeuge (Labs) zum Kurs "%%courseTitleDe%%". Sie wird mit dem DS Labs Framework (`@whz-ds-labs/ui`, `@whz-ds-labs/lab-kit`) gebaut und auf GitHub Pages veröffentlicht.

### Starten

```powershell
npm install
npm run dev
```

Weitere Befehle: `npm test` (Unit-Tests), `npm run test:py` (Python-Golden-Tests), `npm run test:e2e` (Browser-Tests), `npm run lint:css`, `npm run build`.

### Neues Lab hinzufügen

Starte in Claude Code mit `/ds-labs:lab-start` und folge dem Ablauf. Der Befehl legt `labs/<thema>/` an und trägt das Lab in `site/course.ts` ein.

### Wichtig

- `package-lock.json` muss eingecheckt werden: Die CI nutzt `npm ci` und bricht ohne Lockfile ab.
- Kursmaterial (Folien, Notebooks, PDFs) gehört nie in dieses Repo, sondern nur in das private Repo `%%course%%-intern`. Der Befehl `npm run guard` prüft das.

## English

This site collects the interactive learning tools (labs) for the course "%%courseTitleEn%%". It is built with the DS Labs framework (`@whz-ds-labs/ui`, `@whz-ds-labs/lab-kit`) and published on GitHub Pages.

### Run

```powershell
npm install
npm run dev
```

More commands: `npm test` (unit tests), `npm run test:py` (Python golden tests), `npm run test:e2e` (browser tests), `npm run lint:css`, `npm run build`.

### Add a lab

Start Claude Code and run `/ds-labs:lab-start`. It creates `labs/<topic>/` and registers the lab in `site/course.ts`.

### Important

- `package-lock.json` must be committed: CI uses `npm ci` and fails without a lockfile.
- Course material (slides, notebooks, PDFs) never belongs in this repo, only in the private repo `%%course%%-intern`. `npm run guard` checks this.
