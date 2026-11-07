# DS Labs Framework

## Deutsch

Dieses Repository enthält das DS-Labs-Framework: die npm-Pakete `@whz-ds-labs/lab-kit` und `@whz-ds-labs/ui` sowie das Claude-Plugin `ds-labs` zum Aufbau interaktiver Lehrlabore für Data-Science-Kurse. Alle drei teilen eine Version. Lizenz: MIT.

Schnellstart (Node 24.15 oder neuer, git, gh, uv und Claude Code vorausgesetzt):

```powershell
claude plugin marketplace add whz-ds-labs/lab-framework
claude plugin install ds-labs@whz-ds-labs
```

Danach in Claude Code `/ds-labs:lab-start` ausführen. Das Handbuch:

1. [Einstieg](docs/de/01-start.md): Voraussetzungen, Plugin, erstes Lab, auch ohne Claude
2. [Architektur](docs/de/02-architecture.md): Pakete, Werkzeug-Vertrag, URL-Schema, Kurs-Repo, lokaler Framework-Link
3. [Design](docs/de/03-design.md): Regeln v0 „Flächen“, Tokens, Prüfungen
4. [Release](docs/de/04-release.md): Changesets, Trusted Publishing, Platzhalter, Renovate
5. [Übergabe](docs/de/05-handover.md): Checkliste für Nachfolger
6. [Entscheidungen](docs/de/06-decisions.md): E1–E8, F1–F10 mit Begründung

Für Entwickler des Frameworks (im Repo-Ordner, ein Befehl pro Zeile):

```powershell
npm install
npm run build
npm test
```

## English

This repository contains the DS Labs framework: the npm packages `@whz-ds-labs/lab-kit` and `@whz-ds-labs/ui` and the Claude plugin `ds-labs` for building interactive teaching labs for data science courses. All three share one version. License: MIT.

Quick start (needs Node 24.15 or newer, git, gh, uv and Claude Code):

```powershell
claude plugin marketplace add whz-ds-labs/lab-framework
claude plugin install ds-labs@whz-ds-labs
```

Then run `/ds-labs:lab-start` in Claude Code. The handbook:

1. [Getting started](docs/en/01-start.md): prerequisites, plugin, first lab, also without Claude
2. [Architecture](docs/en/02-architecture.md): packages, tool contract, URL scheme, course repo, local framework link
3. [Design](docs/en/03-design.md): rules v0 "Surfaces", tokens, checks
4. [Release](docs/en/04-release.md): Changesets, Trusted Publishing, placeholder, Renovate
5. [Handover](docs/en/05-handover.md): checklist for successors
6. [Decisions](docs/en/06-decisions.md): E1–E8, F1–F10 with reasons

For framework developers (in the repo folder, one command per line):

```powershell
npm install
npm run build
npm test
```
