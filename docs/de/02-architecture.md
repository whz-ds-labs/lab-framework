# Architektur

Woraus das Framework besteht, wie ein Kurs-Repo es nutzt und wie ein Werkzeug mit der Adresszeile spricht. Die englische Fassung dieses Kapitels ist [02-architecture.md](../en/02-architecture.md).

## Pakete und Abhängigkeitsrichtung

Das Framework-Repo `whz-ds-labs/lab-framework` ist ein npm-Workspaces-Monorepo mit drei Teilen, die immer dieselbe Version tragen:

| Teil | Inhalt |
|---|---|
| `@whz-ds-labs/lab-kit` | Logik ohne eigene Oberfläche: `defineLab`/`defineTool`/`defineCourse`, Hash-Router und URL-Zustand, Szenarien, DE/EN-Texte, Worker-Client, Zufallsgenerator mit Seed, CSV-Import, Verify-Attribute, Test-Helfer, stylelint-Plugin |
| `@whz-ds-labs/ui` | Vue-Komponenten und CSS: Design-Tokens, `LabShell`, `createCourseApp`, Schieberegler, Diagramm-Bausteine, Hilfe-Schublade, `StatusPanel`, `Formula` |
| `ds-labs` (Ordner `plugin`) | Claude-Plugin mit Skills, Agents, Vorlagen und dem Gerüst-Skript |

Die Abhängigkeit läuft nur in eine Richtung: Ein Kurs-Repo hängt von `ui` und `lab-kit` ab; `ui` hängt von `lab-kit` mit exakt derselben Version ab; `lab-kit` hängt von keinem der beiden ab. `vue` ist Peer-Abhängigkeit beider Pakete, `katex` und `d3-scale` zusätzlich von `ui`. Weil alle Versionen exakt sind, installiert npm je Paket eine Kopie. Eine zweite Kopie von `vue` würde `provide`/`inject` und Reaktivität zerstören; deshalb liegt der Modulzustand von lab-kit zusätzlich in einem Objekt unter einem globalen Symbol und überlebt eine doppelte Kopie.

## Einstiegspunkte

| Paket | Import | Zweck |
|---|---|---|
| `@whz-ds-labs/lab-kit` | `.` | Definitionen, Router, i18n, Szenarien, Helfer |
| | `/worker` | Job-Client für Hintergrundrechnungen (ohne DOM importierbar) |
| | `/testing` | Unit-Test-Helfer: Golden-JSON laden und mit relativer Toleranz vergleichen |
| | `/testing/e2e` | Playwright-Helfer: Verify-Zustände, 375-px-Überlaufprüfung, axe |
| | `/stylelint` | stylelint-Plugin mit den beiden Design-Regeln |
| | `/stylelint/config` | fertige stylelint-Konfiguration |
| `@whz-ds-labs/ui` | `.` | Komponenten und `createCourseApp` |
| | `/tokens.css` | Design-Tokens |
| | `/style.css` | Basisstile der Komponenten |

`/worker`, `/testing` und `/stylelint*` lassen sich in reinem Node ohne DOM importieren. Beide Pakete sind reines ESM.

## Kurs, Lab und Werkzeug

- Ein **Kurs** (`defineCourse`) hat eine ID, Titel, einen Einleitungstext, eine Liste von Labs und eine Roadmap mit Ideen, die noch kommen. Er liegt in `site/course.ts`.
- Ein **Lab** (`defineLab`) ist ein Thema: ID, Titel, Kurzbeschreibung, seine Werkzeuge und seine Textkataloge für Deutsch und Englisch.
- Ein **Werkzeug** (`defineTool`) ist eine interaktive Ansicht innerhalb eines Labs: ID, Titel, Kurzbeschreibung, die Vue-Komponente, `parse` und `toQuery` für den Zustand, Szenarien und Hilfethemen.

IDs entsprechen in den Definitionen `^[a-z][a-z0-9-]{1,40}$`; das Gerüst-Skript ist strenger und legt nur IDs an, die `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` entsprechen. Eine fehlerhafte Definition bricht beim Start mit einem `BAD_DEFINITION`-Fehler ab, der den Grund nennt. `createCourseApp(course)` aus `@whz-ds-labs/ui` macht aus dem Kurs die Vue-App mit Kopfzeile, Werkzeug-Pillen, Hilfe-Schublade, Sprachknopf, Kursseite und Laborseite.

## Der Werkzeug-Vertrag

Ein Werkzeug ist eine eigenständige Vue-Komponente, die weder Router noch URL kennt:

- Prop `state` mit dem typisierten Zustand, Prop `labId`;
- Event `update:state` mit dem vollständigen nächsten Zustand (ersetzen, nie verändern);
- optional `defineExpose({ runAction(name) })`, genau einmal aufgerufen, wenn ein Szenario mit `action` angewendet wird.

`parse(query)` wirft nie: Jede Korrektur trägt den Parameternamen in `problems` ein, und die Shell zeigt einen Hinweis auf die korrigierte Adresse. `toQuery(state)` lässt Parameter weg, die dem Standardwert entsprechen. Ein Adapter in lab-kit koppelt den Zustand an die URL, sodass dieselbe Komponente später in eine Seite einer Lernwebseite eingebettet werden kann. Jede interaktive Komponente trägt die Verify-Attribute `data-verify-unit`, `data-verify-state` (`loading`, `empty`, `ready` oder `error`), optional `data-verify-count` und im Fehlerzustand `data-verify-error`.

## URL-Schema

Die Seite nutzt Hash-Routen und funktioniert so auf GitHub Pages ohne Server-Regeln:

```
#/<lab>/<tool>?<parameter>&scenario=<id>&lang=<de|en>
```

- `<lab>` und `<tool>` sind die IDs aus den Definitionen.
- `<parameter>` sind die eigenen, kurzen und stabilen Parameternamen des Werkzeugs.
- `scenario=<id>` kennzeichnet einen fertigen Zustand. Ändern Lernende einen Parameter so, dass der Zustand vom Szenario abweicht, bleibt `scenario=<id>` in der Adresse; die Seite zeigt einen Hinweis „geändert“ mit einem Knopf, der das Szenario wiederherstellt. Der Parameter verschwindet erst, wenn der Hinweis geschlossen wird.
- `lang` wählt die Oberflächensprache.

Ein Link mit Szenario ist ein stabiler Lehr-Link: Er setzt alle Parameter und kann eine einmalige Aktion ausführen, zum Beispiel ein Bootstrap.

## Textschlüssel

- Jeder Text existiert auf Deutsch und Englisch. Ein fehlender Schlüssel zeigt den Schlüssel selbst, und der Vollständigkeitstest schlägt fehl, wenn ein Schlüssel nur in einer Sprache existiert.
- `t()` aus `useI18n()` ohne Scope nimmt immer **volle Schlüssel**: `kit.…` für Framework-Texte und `<labId>.…` für Lab-Texte. Framework-Komponenten nutzen volle `kit.*`-Schlüssel, und Hinweise speichern volle Schlüssel.
- Der Lab-Katalog wird unter der Lab-ID registriert, seine Schlüssel stehen in `i18n/de.ts` und `i18n/en.ts` daher relativ zu diesem Scope (`line.plot.title` wird zu `<labId>.line.plot.title`). `useI18n(scope)` ist eine Erleichterung nur für Lab-Code.
- Hilfetexte liegen unter `<toolId>.help.read.<key>` und `<toolId>.help.controls.<key>`.

## Aufbau eines Kurs-Repos

```
<kurs>/
  site/                  Kurs-Startseite (course.ts, main.ts)
  labs/<thema>/
    core/                Themen-Mathematik, framework-frei
    tools/               Werkzeuge als Vue-Komponenten, Zustands-Parser
    worker/              Hintergrund-Jobs
    scenarios.ts, help/, i18n/
    golden/              make_golden.py, pyproject.toml, uv.lock
    tests/               Unit, Golden-JSON, e2e
  scripts/               Guard, changed-labs, run-golden
  .github/workflows/     CI und Deploy auf GitHub Pages
```

Das private Repo `<kurs>-intern` liegt daneben und enthält `materials/` (Folien, Notebooks) und `docs/<thema>/` (Analysen, Spezifikationen, Pläne). Python-Versionen werden je Lab festgelegt, weil Notebooks verschiedener Themen unterschiedliche Umgebungen nutzen. Der Pages-Deploy baut mit `VITE_BASE=/<Repo-Name>/`.

## Lokalen Framework-Stand einbinden

Wenn du das Framework änderst und die Wirkung vor einem Release in einem Kurs-Repo sehen willst, führst du im Framework-Repo aus (ein Befehl, der Kursordner als Argument):

```powershell
node scripts/link-local.mjs "C:\work\data-science-3"
```

Das Skript baut beide Pakete, packt sie nach `.local-packs/` und führt im Kurs-Repo `npm install --no-save` mit beiden Tarballs zusammen aus. Am Ende gibt es `npm ls @whz-ds-labs/ui @whz-ds-labs/lab-kit vue` aus und schlägt fehl, wenn mehr als eine Kopie von `vue` oder `@whz-ds-labs/lab-kit` installiert ist.

- Keine Symlinks oder Junctions, daher läuft es unter Windows ohne Administratorrechte.
- `package.json` und `package-lock.json` des Kurs-Repos bleiben unverändert, es lässt sich also nichts versehentlich Unbrauchbares einchecken.
- Die installierten Dateien sind dieselben Tarballs wie in der CI; „läuft lokal“ heißt daher „läuft in der CI“.
- **Rückgängig** machst du mit `npm ci` im Kurs-Repo.
- **Grenze:** Jedes spätere `npm install <x>`, `npm uninstall`, `npm ci` oder jedes Renovate-Update gleicht den Baum wieder mit der Registry ab und wirft die eingebundenen Tarballs stillschweigend weg. Führe `link-local.mjs` nach so einem Befehl erneut aus. Meldet npm `EINTEGRITY` bei gleicher Version, führe zuerst `npm ci` aus und binde erneut ein.
- **Warum nicht `npm link`?** Es legt Junctions auf den Framework-Workspace an, dessen eigenes `node_modules/vue` dann als zweite Vue-Kopie geladen wird, und jedes Kurs-Repo bräuchte `resolve.dedupe`-Anpassungen. Der Preis der gewählten Methode ist ein erneuter Lauf von etwa 15 Sekunden nach jeder Framework-Änderung.
