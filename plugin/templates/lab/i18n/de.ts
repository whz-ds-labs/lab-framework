import type { Catalog } from '@whz-ds-labs/lab-kit'

// Keys are relative to the lab scope (the lab id); the shell prefixes them.
export const de: Catalog = {
  line: {
    fit: { title: 'Ausgleichsgerade' },
    n: { label: 'Anzahl Punkte n' },
    slope: 'Steigung',
    intercept: 'Achsenabschnitt',
    r2: 'Bestimmtheitsmaß R²',
    ci: 'Bootstrap-Intervall der Steigung (95 %)',
    error: {
      TOO_FEW_POINTS: 'Mindestens zwei Punkte nötig.',
      DEGENERATE_X: 'Alle x-Werte sind gleich.',
      UNKNOWN: 'Unerwarteter Fehler.',
    },
    help: {
      purpose: 'Das Werkzeug legt eine Gerade nach der Methode der kleinsten Quadrate durch eine Punktwolke.',
      read: {
        fit: 'Steigung, Achsenabschnitt und R² beschreiben die angepasste Gerade; R² nahe 1 heißt: die Gerade erklärt fast die gesamte Streuung.',
      },
      controls: { n: 'Mit n legst du fest, wie viele Punkte zufällig erzeugt werden.' },
    },
  },
}
