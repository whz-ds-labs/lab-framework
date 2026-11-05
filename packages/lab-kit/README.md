# @whz-ds-labs/lab-kit

Framework-free core and Vue runtime for DS Labs teaching tools: course, lab and tool definitions, i18n (German and
English), hash router, URL-coupled tool state, ready-made scenarios, background jobs in a Web Worker, test helpers
(golden files, Playwright, axe) and a stylelint plugin for the design rules; plus CSV parsing, seeded RNG, number
formatting and URL query parsers.
Framework-freier Kern und Vue-Laufzeit für DS-Labs-Lehrwerkzeuge: Kurs-, Labor- und Werkzeug-Definitionen, i18n
(Deutsch und Englisch), Hash-Router, URL-gekoppelter Werkzeugzustand, fertige Szenarien, Hintergrundberechnungen im
Web Worker, Test-Helfer (Golden-Dateien, Playwright, axe) und ein stylelint-Plugin für die Design-Regeln; dazu
CSV-Parser, Zufallsgenerator mit Seed, Zahlenformatierung und URL-Query-Parser.

```
npm install @whz-ds-labs/lab-kit vue
```

Requires Node >= 24.15 / Benötigt Node >= 24.15. License: MIT.

## Handbook / Handbuch

- EN: [Architecture](https://github.com/whz-ds-labs/lab-framework/blob/main/docs/en/02-architecture.md), [Getting started](https://github.com/whz-ds-labs/lab-framework/blob/main/docs/en/01-start.md)
- DE: [Architektur](https://github.com/whz-ds-labs/lab-framework/blob/main/docs/de/02-architecture.md), [Einstieg](https://github.com/whz-ds-labs/lab-framework/blob/main/docs/de/01-start.md)

## Entry points / Einstiegspunkte

| Import | EN | DE |
|---|---|---|
| `@whz-ds-labs/lab-kit` | definitions, router, i18n, scenarios, tool state, helpers | Definitionen, Router, i18n, Szenarien, Werkzeugzustand, Helfer |
| `/worker` | job client for background calculations (no DOM needed) | Job-Client für Hintergrundberechnungen (ohne DOM) |
| `/testing` | unit-test helpers: golden JSON, relative tolerance, message-catalog checks | Unit-Test-Helfer: Golden-JSON, relative Toleranz, Prüfung der Meldungskataloge |
| `/testing/e2e` | Playwright helpers: verify states, 375 px overflow check, axe | Playwright-Helfer: Verify-Zustände, 375-px-Überlaufprüfung, axe |
| `/stylelint` | stylelint plugin with the two design rules | stylelint-Plugin mit den zwei Design-Regeln |
| `/stylelint/config` | ready-made stylelint configuration | fertige stylelint-Konfiguration |
