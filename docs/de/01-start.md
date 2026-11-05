# Einstieg

Dieses Kapitel führt von einem leeren Rechner bis zum ersten Lab, das im Browser läuft. Die Kapitel sind in der [README](../../README.md) aufgelistet; die englische Fassung dieses Kapitels ist [01-start.md](../en/01-start.md).

## Voraussetzungen

| Werkzeug | Benötigte Version | Prüfen |
|---|---|---|
| Node.js | 24.15 oder neuer (Node 24 LTS) | `node -v` |
| git | 2.28 oder neuer | `git --version` |
| GitHub-CLI `gh` | aktuelle Version, angemeldet | `gh auth status` |
| uv | aktuelle Version | `uv --version` |
| Claude Code | aktuelle Version | `claude --version` |
| Plugin superpowers | in Claude Code installiert | siehe unten |

uv führt die Python-Referenzrechnungen (Golden-Tests) aus. Die dafür genutzte Python-Version installierst du einmalig:

```powershell
uv python install 3.12
```

superpowers installierst du in Claude Code (das Plugin ds-labs baut auf dessen Skills auf):

```
/plugin install superpowers@claude-plugins-official
```

Alternativ fügst du zuerst den superpowers-Marketplace hinzu (`/plugin marketplace add obra/superpowers-marketplace`) und installierst `superpowers@superpowers-marketplace`. Starte Claude Code danach neu.

## Plugin installieren

Diese beiden Befehle führst du in einem normalen Terminal nacheinander aus:

```powershell
claude plugin marketplace add whz-ds-labs/lab-framework
claude plugin install ds-labs@whz-ds-labs
```

Das Plugin `ds-labs` bringt sechs Skills (`lab-start`, `lab-analyze`, `lab-build`, `lab-design`, `lab-release`, `lab-standards`), drei Agents (Plan-Prüfer, Design-Prüfer, Verifier) und die Vorlagen für Kurs-Repos und Labs mit. Aktualisierungen kommen mit einer neuen Plugin-Version; hole sie mit `claude plugin update ds-labs@whz-ds-labs`.

## Das erste Lab mit Claude

Öffne Claude Code in einem leeren Arbeitsordner (die beiden Repos entstehen als Unterordner darin) und starte den geführten Ablauf:

```
/ds-labs:lab-start
```

`lab-start` prüft zuerst die Voraussetzungen von oben und nennt zu jedem Fehlenden die Abhilfe. Danach fragt es:

- eine Kurs-ID (Kleinbuchstaben, Ziffern und einzelne Bindestriche, mit einem Buchstaben beginnend, zum Beispiel `data-science-3`),
- den Kurstitel auf Deutsch und Englisch,
- eine Themen-ID für das erste Lab (gleiche Regeln, zum Beispiel `ausgleichsgerade`) samt deutschem und englischem Titel.

Ohne deine ausdrückliche Freigabe wird nichts auf GitHub angelegt. Nach der Freigabe entstehen das öffentliche Kurs-Repo `whz-ds-labs/<kurs>` und das private Repo `whz-ds-labs/<kurs>-intern` (Kursmaterial und Planungsdokumente, nie öffentlich); beide werden aus den Vorlagen aufgebaut und das erste Lab wird ergänzt. Danach führt der Skill durch Analyse deines Materials, Spezifikation, Plan, Umsetzung und Release.

## Dasselbe ohne Claude

Alles, was `lab-start` aufbaut, stammt aus einem abhängigkeitsfreien Node-Skript. Du kannst es also von Hand ausführen. Ersetze `<plugin>` durch den Plugin-Ordner (nächster Abschnitt):

```powershell
node "<plugin>\scripts\scaffold.mjs" course --dir "C:\work\data-science-3" --course "data-science-3" --title-de "Data Science 3" --title-en "Data Science 3"
node "<plugin>\scripts\scaffold.mjs" intern --dir "C:\work\data-science-3-intern" --course "data-science-3"
node "<plugin>\scripts\scaffold.mjs" lab --dir "C:\work\data-science-3" --topic "ausgleichsgerade" --title-de "Ausgleichsgerade" --title-en "Least squares line"
```

IDs müssen `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` entsprechen. Titel dürfen keine Anführungszeichen, keinen Backslash, Backtick, `$`, `<`, `>`, `{`, `}` oder `%` enthalten. Das Skript gibt die angelegten Pfade aus oder endet mit einer Zeile auf stderr und schreibt nichts. Das Lab wird in `site/course.ts` unter dem Namen `<camelTopic>Lab` eingetragen, zum Beispiel `ausgleichsgeradeLab`.

Solange das erste Framework-Release (0.1.0) nicht auf npm liegt, findet `npm install` die Framework-Pakete nicht. Es gibt zwei Übergangswege, beide mit einem lokalen Framework-Stand aus einem Klon des Framework-Repos (ein Befehl pro Zeile):

```powershell
Set-Location "C:\src\lab-framework"
node scripts/pack.mjs .local-packs
```

- **Beim Anlegen:** Hänge `--packs "C:\src\lab-framework\.local-packs"` an den obigen Befehl `scaffold.mjs course` an. Der Kurs hängt dann von den beiden Tarballs ab.
- **Nach der Installation:** Führe im Framework-Repo `node scripts/link-local.mjs "C:\work\data-science-3"` aus; siehe [Lokalen Framework-Stand einbinden](02-architecture.md#lokalen-framework-stand-einbinden).

Danach, im Kursordner, ein Befehl pro Zeile (die `git`-Zeilen machen den ersten Commit samt Lockfile; pushe nicht, bevor du ein Remote festgelegt hast):

```powershell
Set-Location "C:\work\data-science-3"
npm install
npm test
npm run test:py
npx playwright install chromium
npm run test:e2e
npm run build
git init -b main
git add -A
git commit -m "chore: scaffold course"
npm run dev
```

Unter Linux installierst du den Browser stattdessen mit seinen Systembibliotheken: `npx playwright install --with-deps chromium`.

`npm test` führt die Unit-Tests aus, `npm run test:py` die Python-Golden-Tests (braucht uv), `npm run test:e2e` die Browser-Tests (braucht einmalig den Chromium-Download), `npm run build` die Typprüfung und den Produktions-Build, `npm run dev` die lokale Seite.

## Wo das Plugin liegt

Claude Code kopiert ein installiertes Plugin in seinen Plugin-Cache. Unter Windows ist der Ordner `%USERPROFILE%\.claude\plugins\cache\whz-ds-labs\ds-labs\<version>\`, unter macOS und Linux `~/.claude/plugins/cache/whz-ds-labs/ds-labs/<version>/`. Gibt es mehrere Versionsordner, nimm den höchsten; dieser Ordner ist `<plugin>`. Dieser Aufbau wurde mit Claude Code 2.1.31x beobachtet und kann sich ändern. Fehlt der Ordner, durchsuche nur den Marketplace-Teil des Caches:

```powershell
Get-ChildItem -Path "$env:USERPROFILE\.claude\plugins\cache\whz-ds-labs" -Recurse -Filter scaffold.mjs | Select-Object -ExpandProperty FullName
```

Der Ordner, der `scripts\scaffold.mjs` enthält, ist `<plugin>`. Arbeitest du stattdessen in einem Klon des Framework-Repos, ist `<plugin>` dessen Ordner `plugin`.

## Lockfile einchecken

`npm install` schreibt `package-lock.json`. Checke sie ein. Die CI jedes Kurs-Repos führt `npm ci` aus, und das bricht ohne Lockfile ab. Dasselbe gilt für die `golden/uv.lock` jedes Labs. Checke nie Kursmaterial (Folien, Notebooks, PDFs, alles unter `materials/`) in das öffentliche Kurs-Repo ein; `npm run guard` lässt den Build sonst fehlschlagen.
