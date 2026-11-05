# Übergabe-Checkliste

Alles, was Nachfolger brauchen, damit DS Labs ohne den ursprünglichen Autor weiterläuft. Gehe die Liste mit dem neuen Owner durch und hake sie ab. Die englische Fassung dieses Kapitels ist [05-handover.md](../en/05-handover.md).

## Personen und Konten

- [ ] Ein **zweiter Owner** in der GitHub-Organisation `whz-ds-labs` (Organization settings, People, Rolle Owner). Der neue Owner bestätigt den Zugriff auf jedes Repo.
- [ ] Ein **zweiter Owner** in der npm-Organisation `whz-ds-labs` (Rolle Owner), mit Zwei-Faktor-Authentifizierung oder Security-Key.
- [ ] Die Kontakt-**E-Mail-Adressen** beider Organisationen, des npm-Kontos und der GitHub-Konten zeigen auf Adressen, die eine einzelne Person überdauern (Funktions- oder Team-Adresse des Fachbereichs). Commits nutzen die GitHub-Noreply-Adresse, nie eine private.
- [ ] Wiederherstellungsoptionen beider Konten (Recovery-Codes, zweiter Faktor) liegen beim neuen Owner.

## Repos und Einstellungen

- [ ] Repo-Liste: `lab-framework` (öffentlich), je Kurs ein öffentliches Repo `<kurs>` und ein privates Repo `<kurs>-intern`. Die Intern-Repos bleiben privat und gehen mit der Owner-Rolle über.
- [ ] **Pages** in jedem öffentlichen Kurs-Repo: Settings, Pages, Source = **GitHub Actions**. Die veröffentlichte Adresse funktioniert nach dem ersten Deploy von `pages.yml`.
- [ ] Einstellungen in `lab-framework`: Actions dürfen Pull Requests erstellen und freigeben; Branch-Schutz auf `main` wie vereinbart; die Renovate-App ist in der Organisation installiert und hat Zugriff auf alle Kurs-Repos.
- [ ] Jedes Kurs-Repo baut grün in der CI (`gh run list --limit 3`), und seine Dateien `package-lock.json` und `golden/uv.lock` sind eingecheckt.
- [ ] Kursmaterial liegt nur in den `-intern`-Repos. `npm run guard` besteht in jedem öffentlichen Repo.

## Veröffentlichung

- [ ] Die npm-Pakete `@whz-ds-labs/lab-kit` und `@whz-ds-labs/ui` existieren, und jedes hat einen **Trusted-Publisher**-Eintrag: Organisation `whz-ds-labs`, Repository `lab-framework`, Workflow `release.yml`, Environment leer. Der neue Owner hat beide Einträge angesehen.
- [ ] Der neue Owner kennt den Release-Ablauf aus [Kapitel 4](04-release.md) und hat ein Test-Release durchgeführt (ein `patch`-Changeset, Merge des Pull Requests „Version Packages“).
- [ ] Das Claude-Plugin lässt sich auf dem Rechner des neuen Owners von Grund auf installieren ([Kapitel 1](01-start.md)).

## Späterer Umzug auf WHZ GitHub Enterprise Server

Ein Umzug per Spiegel behält Verlauf, Branches und Tags. Issues, Pull Requests, Einstellungen, Secrets, Pages und Actions-Variablen ziehen **nicht** mit und müssen neu angelegt werden. Je Repo, bei bereits angelegtem leerem Ziel-Repo auf dem neuen Server (ein Befehl pro Zeile):

```powershell
git clone --mirror https://github.com/whz-ds-labs/<repo>.git
Set-Location "<repo>.git"
git push --mirror https://<neuer-server>/<neue-org>/<repo>.git
```

Prüfe danach diese Punkte:

- [ ] Paket-URLs in der `package.json` (`repository.url`), der Marketplace-Eintrag und das Plugin-Manifest zeigen auf die neue Adresse. Dafür ist ein neues Release nötig.
- [ ] **Trusted Publishing ist an github.com gebunden.** Zieht das Framework-Repo um, kläre zuerst, ob npm deinen neuen Server unterstützt; andernfalls bleibt `lab-framework` auf github.com, oder das Release wird auf einen Token-Ablauf umgestellt.
- [ ] Kurs-Repos bekommen eine eigene Pages-Einstellung und einen neuen Basispfad. Der Deploy leitet ihn aus dem Repo-Namen ab (`VITE_BASE`), Code-Änderungen sind also nicht nötig; an anderer Stelle veröffentlichte Links müssen aber aktualisiert werden.
- [ ] Renovate und die CI-Runner müssen auf dem neuen Server verfügbar sein; passe die Workflows an, wenn Marketplace-Actions dort nicht erlaubt sind.
- [ ] Nach dem Umzug werden die alten Repos archiviert, nicht gelöscht, bis alles geprüft ist.
