# Release

Wie eine neue Framework-Version zu npm und in den Plugin-Cache kommt. Dieses Kapitel richtet sich an die Maintainer des Framework-Repos; ein Kurs-Release behandelt der Skill `lab-release`. Die englische Fassung dieses Kapitels ist [04-release.md](../en/04-release.md).

## Eine Version für alles

`@whz-ds-labs/lab-kit`, `@whz-ds-labs/ui` und das Plugin `ds-labs` teilen eine Version (eine feste Changesets-Gruppe `fixed`). „Framework 0.3.0“ meint damit immer genau einen Stand. `npm run check:versions` schlägt fehl, wenn sich `plugin/package.json`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` und die beiden Pakete unterscheiden. Auch das Plugin braucht die Erhöhung: Claude Code holt eine Aktualisierung nur, wenn sich die Versionsnummer ändert.

## Changesets im Alltag

Jede Änderung, die bei den Nutzern ankommen soll, bekommt neben dem Code eine kleine Beschreibungsdatei:

```powershell
npx changeset
```

Wähle die Pakete und die Stufe (`patch`, `minor`, `major`) und schreibe einen Satz. Checke die erzeugte Datei in `.changeset/` zusammen mit der Änderung ein. Wegen der festen Gruppe bekommen alle drei Teile dieselbe neue Version, was auch immer du wählst.

## Vom Merge zu npm

Der Workflow `release.yml` läuft bei jedem Push auf `main`:

1. Er ruft zuerst die komplette CI (`ci.yml`) auf: Guard, Versionsprüfung, Build, Typprüfung, Lint, Tests und der Integrationslauf. Der Pull Request „Version Packages“ wird mit dem eingebauten Token erzeugt und löst deshalb keinen eigenen CI-Lauf aus; daher führt das Release die Prüfungen selbst erneut aus.
2. Die Changesets-Action öffnet oder aktualisiert den Pull Request **Version Packages**. Er erhöht alle Versionen, schreibt die Changelogs und gleicht die Plugin-Manifeste und das Lockfile ab (`npm run version`).
3. Du prüfst diesen Pull Request und mergst ihn. Dieser Merge ist die Release-Entscheidung.
4. Im folgenden Lauf gibt es keine offenen Changesets mehr, deshalb veröffentlicht `node scripts/publish.mjs` zuerst `@whz-ds-labs/lab-kit`, dann `@whz-ds-labs/ui` (npm Trusted Publishing mit Provenance) und legt zuletzt den Tag `v<version>` an und pusht ihn. Das Skript lässt sich gefahrlos wiederholen: Versionen, die schon auf npm liegen, und vorhandene Tags werden übersprungen.

Weil der Pull Request „Version Packages“ keinen eigenen CI-Lauf bekommt, würde eine Branch-Protection-Regel mit erforderlichen Status-Checks seinen Merge blockieren. Der Release-Workflow führt die komplette CI vor dem Veröffentlichen erneut aus; Maintainer mergen diesen Pull Request daher ohne die erforderlichen Checks (zum Beispiel als Administrator) oder stoßen die CI neu an, indem sie den Pull Request schließen und wieder öffnen.

**Template-Änderungen und unveröffentlichte APIs.** Der Marketplace-Eintrag des Plugins zeigt auf `./plugin` im Branch `main`; eine Änderung am Kurs-Template erreicht neue Installationen also, sobald sie gemergt ist, lange vor dem nächsten npm-Release. Eine Template-Änderung, die noch nicht veröffentlichte Paket-APIs braucht, wird deshalb nur zusammen mit dem Release gemergt, das diese APIs veröffentlicht: ein Pull Request mit der Änderung, dem Template-Update und dem Changeset.

Nirgends ist ein npm-Token gespeichert. Das Veröffentlichen läuft über ein kurzlebiges Identitäts-Token (OIDC) von GitHub Actions, mit Node 24 und npm 11.5.1 oder neuer.

## Einmalige Einrichtung

Das machst du einmal, vor dem ersten echten Release. Grund: npm akzeptiert einen Trusted Publisher nur für bereits existierende Pakete, daher braucht jedes Paket einen manuellen Platzhalter mit Version `0.0.0`.

**1. Platzhalter erzeugen.** Im Framework-Repo, ein Befehl pro Zeile:

```powershell
node scripts/placeholder.mjs "$env:TEMP\ds-labs-placeholders"
npm login
```

Der erste Befehl schreibt die beiden Platzhalter-Pakete und gibt die Befehle für Schritt 2 aus. `npm login` fragt nach deiner Anmeldung (mit Security-Key, falls eingerichtet).

**2. Platzhalter veröffentlichen.** Für jeden der beiden Ordner `lab-kit` und `ui` unterhalb des Ausgabeordners:

```powershell
Set-Location "$env:TEMP\ds-labs-placeholders\lab-kit"
npm publish --access public
Set-Location "$env:TEMP\ds-labs-placeholders\ui"
npm publish --access public
```

**3. Trusted Publisher eintragen** auf npmjs.com für jedes Paket (Paketseite, Settings, Trusted Publisher, GitHub Actions):

| Feld | Wert |
|---|---|
| Organization or user | `whz-ds-labs` |
| Repository | `lab-framework` |
| Workflow filename | `release.yml` |
| Environment | leer lassen |

**4. Pull Requests aus Actions erlauben.** Im GitHub-Repo: Settings, Actions, General, Workflow permissions, **Allow GitHub Actions to create and approve pull requests** anhaken. Ohne diese Einstellung kann die Changesets-Action den Pull Request „Version Packages“ nicht öffnen. In einer **neuen Organisation** muss das zuerst auf Organisationsebene erlaubt werden (Organization Settings, Actions, General, Workflow permissions); bis dahin bleibt die Repo-Einstellung ausgegraut.

Das erste echte Release ist dann `0.1.0`. Schlägt die erste Veröffentlichung bei der Anmeldung fehl, lies den Kommentar in `release.yml` zu `registry-url` und `NODE_AUTH_TOKEN`.

## Renovate in Kurs-Repos

Jedes Kurs-Repo enthält eine `renovate.json`, die alle `@whz-ds-labs/*`-Pakete in einem Pull Request bündelt und exakte Versionen festschreibt. Damit sie wirkt, muss die **Renovate-App in der GitHub-Organisation** `whz-ds-labs` installiert sein und Zugriff auf die Kurs-Repos haben (Organization settings, GitHub Apps). Die Kurs-CI testet dann jeden Update-Pull-Request, und die Kurs-Maintainer entscheiden, wann sie ihn mergen. Nach dem Merge eines solchen Updates bindest du einen lokalen Stand erneut ein, falls du einen nutzt (siehe [Lokalen Framework-Stand einbinden](02-architecture.md#lokalen-framework-stand-einbinden)).
