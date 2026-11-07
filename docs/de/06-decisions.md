# Entscheidungen

Die Entscheidungen hinter DS Labs mit ihren Gründen und den verworfenen Alternativen. Lies sie, bevor du die Grundlagen änderst. Die englische Fassung dieses Kapitels ist [06-decisions.md](../en/06-decisions.md).

## Gesamtkonzept (E1 bis E8)

| # | Entscheidung | Begründung | Verworfen |
|---|---|---|---|
| E1 | GitHub-Organisation **`whz-ds-labs`** auf github.com; der Autor ist zunächst einziger Owner | Übergabe durch Owner-Tausch ohne Adressänderung; eine Organisation lässt sich sofort unter einem Privat-Account anlegen | Repos unter einem persönlichen Konto (ein Transfer ändert Adressen); WHZ-GitHub-Enterprise jetzt (Organisation nur über das Rechenzentrum, Pages-Verfügbarkeit unklar) |
| E2 | **Ein Framework-Repo plus ein Repo je Kurs** | Kurse können verschiedenen Profs gehören; der Kurs ist die natürliche Wartungseinheit | Ein Monorepo für alles (Rechte nicht trennbar); ein Repo je Lab (etwa 40 Repos) |
| E3 | Gemeinsamer Code als **versionierte npm-Pakete** `@whz-ds-labs/ui` und `@whz-ds-labs/lab-kit`, öffentlich auf npmjs.com; Veröffentlichung nur durch die CI; Updates per Renovate-Pull-Request | Nachvollziehbare Versionen, Kurse entscheiden selbst über Updates, Installation ohne Anmeldung | Git-Abhängigkeit oder Submodul (umständlich, bindet an Git-Adressen); Kopie plus Sync-Befehl (Drift) |
| E4 | **Ein privates Intern-Repo je Kurs** (`<kurs>-intern`) für Kursmaterial und Planungsdokumente | Material darf nicht öffentlich sein, muss aber bei der Übergabe mitgehen; Zugriff je Kurs trennbar | Ein Intern-Repo für alle Kurse; lokaler oder Cloud-Speicher wie bisher |
| E5 | **Labs als Module eines Kurs-Repos**; jedes Werkzeug ist eine eigenständige, per Props und Events steuerbare Vue-Komponente; die URL-Kopplung ist ein austauschbarer Adapter | Heute eine Pages-Site je Kurs, später Einbettung in Lernseiten ohne Umbau | Eine App je Lab |
| E6 | **Claude-Plugin im Framework-Repo** mit eigenen Skills, Agents, Vorlagen und Wissensreferenzen; setzt das öffentliche Plugin *superpowers* voraus | Unabhängig von Konto und Rechner; Nachfolger brauchen kein privates Setup | Wissen nur in einem privaten Wiki; Skills nur im Claude-Ordner des Nutzers |
| E7 | **Reihenfolge:** Framework v0.1, dann ein Pilot-Lab (Ensemble Learning), dann der Umzug der bestehenden Lab-Sammlungen der Kurse DS2 und DS3, dann Design-System v1 mit dem Prof | Design braucht Prof-Zeit; der Pilot testet das Framework unverfälscht; der Umzug ist danach Mechanik | Design zuerst; Umzug vor dem Pilot |
| E8 | **Design v0 sofort, v1 später:** Bis zur Abstimmung mit dem Prof gilt eine Übergangsfassung mit der Regel „keine Linien als Trenner, Gliederung über Abstand und Flächen“; v1 ersetzt nur Tokens und Stile, nicht die Schnittstellen | Feedback des Profs ohne Wartezeit teilweise umsetzen, spätere Abnahme ohne Umbau | Design komplett aufschieben |

## Framework v0.1 (F1 bis F10)

| # | Entscheidung | Begründung |
|---|---|---|
| F1 | npm Workspaces (kein pnpm, kein turbo) | Ein Werkzeug weniger für Nachfolger |
| F2 | Changesets mit **fester gemeinsamer Version** für `ui`, `lab-kit` und das Plugin | „Framework 0.3.0“ ist eindeutig; keine Mischstände |
| F3 | Node 24 LTS (enthält npm 11) | Trusted Publishing braucht npm 11.5.1 oder neuer |
| F4 | Veröffentlichen nur aus GitHub Actions per Trusted Publishing mit Provenance; ein einmaliger manueller Platzhalter `0.0.0` je Paket | npm erlaubt einen Trusted Publisher erst für existierende Pakete |
| F5 | Design v0 „Flächen“: Gliederung über Grauton-Flächen, Abstände und Pillen-Navigation; keine Trennlinien | Der Prof fand das alte Design unruhig mit vielen horizontalen Linien; Variante B gewann den Mockup-Vergleich |
| F6 | Design-Regeln werden automatisch geprüft (stylelint, e2e) plus ein Design-Prüfer-Agent vor Releases | Regeln allein erodieren unbemerkt |
| F7 | Code wird aus der bestehenden Lab-Sammlung **herausgelöst**, nicht neu geschrieben; die alte Sammlung bleibt bis zu ihrer eigenen Migration unverändert | Bewährter, getesteter Code; Migration ist ein eigenes Vorhaben |
| F8 | Zweisprachigkeit Deutsch und Englisch durchgehend (Labs, Handbuch, Kurs-Repos) | Labs, Handbuch und Kurs-Repos sollen in beiden Sprachen nutzbar sein |
| F9 | Das Plugin ist eigenständig; einzige Voraussetzung ist das öffentliche Plugin `superpowers` | Portabel auf andere Konten, Profs und Kollegen |
| F10 | Lizenz MIT, Copyright „whz-ds-labs contributors“ | Wie die früheren Lab-Sammlungen; Organisation statt Person |

## Entscheidung zum lokalen Framework-Link

**Methode: packen und ohne Speichern installieren.** `node scripts/link-local.mjs <kursordner>` baut beide Pakete, packt sie nach `.local-packs/` und führt im Kurs-Repo `npm install --no-save <ui.tgz> <lab-kit.tgz>` aus (beide Tarballs immer zusammen). Es gibt `npm ls @whz-ds-labs/ui @whz-ds-labs/lab-kit vue` aus und schlägt fehl, wenn mehr als eine Kopie von `vue` oder `@whz-ds-labs/lab-kit` installiert ist. Rückgängig mit `npm ci`.

Gründe:

- Es läuft unter Windows ohne Administratorrechte, weil es weder Symlinks noch Junctions nutzt.
- `package.json` und `package-lock.json` des Kurs-Repos ändern sich nicht, es lässt sich also nichts versehentlich Unbrauchbares einchecken.
- Es entspricht dem Integrationsweg der CI (Tarballs); „läuft lokal“ heißt daher „läuft in der CI“.

Bekannte Grenze: Jedes spätere `npm install <x>`, `npm uninstall`, `npm ci` oder jedes Renovate-Update wirft die eingebundenen Tarballs wieder weg; führe das Skript dann erneut aus. Die Anwendung beschreibt [Kapitel 2](02-architecture.md#lokalen-framework-stand-einbinden).

Verworfen: `npm link` und `file:`-Verzeichnisabhängigkeiten. Sie legen Junctions auf den Framework-Workspace an, dessen eigenes `node_modules/vue` dann als zweite Vue-Kopie geladen wird (kaputte `provide`/`inject`, Reaktivität und i18n-Singletons zwischen den Paketen), und jedes Kurs-Repo bräuchte `resolve.dedupe`-Anpassungen. Der Preis der gewählten Methode ist ein erneuter Lauf von etwa 15 Sekunden nach jeder Framework-Änderung.
