# Design v0 „Flächen“

Die Übergangsfassung des Designs, bis das Design-System v1 mit dem Prof abgestimmt ist. v1 ersetzt nur Tokens und Stile, nicht die Schnittstellen. Die englische Fassung dieses Kapitels ist [03-design.md](../en/03-design.md).

## Die Regeln

Leitgedanke: Gliederung entsteht durch **Flächen und Abstände**, nie durch Linien.

1. Keine CSS-Linien als Trenner: kein `border-top/-bottom/-left/-right`, keine sichtbare `border`-Kurzform, keine `<hr>`-Stile im Layout-CSS.
2. Höchstens drei Flächenstufen: Seite, Bereich, Karte. Eine Karte liegt auf einem Bereich, ein Bereich auf der Seite.
3. Eine Akzentfarbe für die Hauptaktion und die aktuelle Auswahl. Statusfarben nur für Status.
4. Farben nur über `--ds-*`-Tokens mit `var()`. Kein Hex, `rgb()`, `hsl()` oder benannte Farben im Lab-Code.
5. Klare Hierarchie: Titel, dann Steuerung, dann Ergebnis.
6. Klickflächen von mindestens 40 px.
7. Klassenfarben kommen immer mit einer Markerform, damit farbsehschwache Lernende die Klassen unterscheiden können.
8. Rahmen nur an Eingabefeldern und Fokusringen.
9. Die Zustände `loading`, `empty`, `error` und `ready` sehen sichtbar verschieden aus (Komponente `StatusPanel`).
10. Hell und Dunkel folgen `prefers-color-scheme` und kommen aus den Tokens; ein Theme wird nie fest verdrahtet.

## Tokens

Importiere `@whz-ds-labs/ui/tokens.css` einmal (die Kurs-Shell tut das bereits). Rohe Farbwerte stehen nur in dieser Datei.

| Gruppe | Tokens |
|---|---|
| Flächen | `--ds-surface-page`, `--ds-surface-area`, `--ds-surface-card` |
| Text | `--ds-text`, `--ds-text-muted` |
| Akzent | `--ds-accent`, `--ds-accent-contrast`, `--ds-focus` |
| Status | `--ds-ok`, `--ds-warn`, `--ds-error`, `--ds-error-bg` |
| Eingabe | `--ds-input-border` |
| Diagramm | `--ds-plot-axis`, `--ds-plot-grid`, `--ds-points` |
| Klassen | `--ds-class-0` bis `--ds-class-5` |
| Abstand | `--ds-space-1` bis `--ds-space-7` |
| Radius | `--ds-radius-s`, `--ds-radius-m`, `--ds-radius-l`, `--ds-radius-pill` |
| Schrift | `--ds-font-s`, `--ds-font-m`, `--ds-font-l`, `--ds-font-xl`, `--ds-weight-regular`, `--ds-weight-strong` |
| Zielgröße | `--ds-hit` |

Die aktuellen Werte liest du in `node_modules/@whz-ds-labs/ui/tokens.css`; kopiere sie nicht in Lab-Code. Die Klassenfarben folgen der Okabe-Ito-Palette und sind farbsehschwach-tauglich.

## Automatische Prüfungen

| Prüfung | Befehl | Was sie findet |
|---|---|---|
| stylelint `ds-labs/no-separator-lines` | `npm run lint:css` | `border-*` mit sichtbarer Linie, `hr`-Selektoren |
| stylelint `ds-labs/color-tokens-only` | `npm run lint:css` | Hex, `rgb()`, `hsl()` und ähnliche Farbwerte |
| 375 px | `expectNoHorizontalOverflow(page, 375)` im e2e-Test jedes Werkzeugs | horizontales Scrollen auf dem Handy |
| axe | `expectNoA11yViolations(page)` im e2e-Test jedes Werkzeugs | Verstöße gegen WCAG AA |
| Tastatur | e2e-Test des Werkzeugs | Elemente, die per Tastatur nicht erreichbar oder bedienbar sind, fehlender Fokusring |

Die Helfer kommen aus `@whz-ds-labs/lab-kit/testing/e2e`. SVG-Diagrammlinien (Achsen, Gitter, Datenlinien) nutzen `stroke` mit `--ds-plot-*`-Tokens; sie sind keine CSS-Rahmen und erlaubt.

## Der Design-Prüfer

Der Agent `lab-design-reviewer` sieht sich Screenshots jedes Werkzeugs und Szenarios bei 1280 px und 375 px an und prüft die obige Liste: keine Linien, höchstens drei Flächenstufen, eine Akzentfarbe, klare Hierarchie, Klickflächen von mindestens 40 px, unterscheidbare Zustände. Er läuft vor jedem Release (Skill `lab-release`), nicht pro Commit. Die Screenshots erzeugst du im Kurs-Repo, ein Befehl pro Zeile:

```powershell
$env:DESIGN_SHOTS="1"
npx playwright test design-shots
```

Die Bilder landen in `design-shots/`. Blockierende Befunde müssen vor einem Release behoben werden; der Rest kommt auf eine Liste für die Maintainer.

## Erlaubte Ausnahmen

Eine begründete Ausnahme ist ein Kommentar **direkt über der Deklaration**, mit Grund:

```css
/* ds-labs-allow: input border keeps the field recognisable */
border: 1px solid var(--ds-input-border);
```

Ein Allow-Kommentar ohne Grund wird selbst gemeldet. Die Ausnahme ist für Eingabefelder gedacht. Wenn du sie für Layout zu brauchen glaubst, ändere das Layout. Outlines und Fokusringe (`--ds-focus`) sind immer erlaubt und dürfen nie entfernt werden.
