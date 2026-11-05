# @whz-ds-labs/ui

Design tokens v0 "Flächen", base styles and shared Vue pieces for DS Labs teaching tools.
Design-Tokens v0 „Flächen“, Basisstile und gemeinsame Vue-Bausteine für DS-Labs-Lehrwerkzeuge.

```
npm install @whz-ds-labs/ui @whz-ds-labs/lab-kit vue katex d3-scale
```

```ts
import '@whz-ds-labs/ui/tokens.css'
import '@whz-ds-labs/ui/style.css'
import { installKitMessages } from '@whz-ds-labs/ui'

installKitMessages()
```

Requires Node >= 24.15 / Benötigt Node >= 24.15. License: MIT.

## Course app and tool contract / Kurs-App und Werkzeug-Vertrag

```ts
import '@whz-ds-labs/ui/tokens.css'
import '@whz-ds-labs/ui/style.css'
import { createCourseApp } from '@whz-ds-labs/ui'
import { course } from './course'

createCourseApp(course).mount('#app')
```

**EN** `createCourseApp(course)` installs the kit texts, registers the texts of every lab and returns the Vue app with the
shell (header, tool pills, help drawer, language button, course and lab home, URL-coupled tool view). A tool component
follows this contract:

- prop `state: S` (the typed state parsed from the address) and prop `labId: string`;
- emits `update:state` with the complete next state (replace it, never mutate); the shell writes it to the address;
- optionally `defineExpose({ runAction(name: string): void })`, called once when a scenario with an `action` is applied.

**DE** `createCourseApp(course)` installiert die Kit-Texte, registriert die Texte jedes Labors und liefert die Vue-App mit
der Shell (Kopfzeile, Werkzeug-Pills, Hilfe-Schublade, Sprachknopf, Kurs- und Labor-Startseite, URL-gekoppelte
Werkzeugansicht). Eine Werkzeug-Komponente folgt diesem Vertrag:

- Prop `state: S` (der aus der Adresse gelesene, typisierte Zustand) und Prop `labId: string`;
- sendet `update:state` mit dem vollständigen nächsten Zustand (ersetzen, nie verändern); die Shell schreibt ihn in die Adresse;
- optional `defineExpose({ runAction(name: string): void })`, genau einmal aufgerufen, wenn ein Szenario mit `action` angewendet wird.

## Handbook / Handbuch

- EN: [Architecture](../../docs/en/02-architecture.md), [Design v0](../../docs/en/03-design.md)
- DE: [Architektur](../../docs/de/02-architecture.md), [Design v0](../../docs/de/03-design.md)

Entry points / Einstiegspunkte: `.`, `/tokens.css`, `/style.css`.
