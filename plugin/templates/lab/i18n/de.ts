import type { Catalog } from '@whz-ds-labs/lab-kit'

// Keys are relative to the lab scope (the lab id); the shell prefixes them.
export const de: Catalog = {
  line: {
    plot: { title: 'Punktwolke und Ausgleichsgerade' },
    formula: { title: 'Geschätzte Gerade' },
    n: { label: 'Anzahl Punkte n' },
    noise: { label: 'Rauschen' },
    seed: { label: 'Seed (Zufallsstartwert)' },
    click: {
      label: 'Klick ins Diagramm',
      hint: 'Klicke ins Diagramm oder nutze „Punkt hinzufügen“, um einen eigenen Punkt zu setzen; mit den Pfeiltasten verschiebst du ihn.',
      full: 'Mehr als 30 eigene Punkte sind nicht möglich.',
    },
    add: 'Punkt hinzufügen',
    userPoint: 'Eigener Punkt',
    reset: 'Punkte zurücksetzen',
    slope: 'Steigung',
    intercept: 'Achsenabschnitt',
    r2: 'Bestimmtheitsmaß R²',
    bootstrap: {
      title: 'Bootstrap-Intervall',
      label: 'Bootstrap-Intervall (1000×)',
      cancel: 'Abbrechen',
      result: 'Bootstrap-Intervall der Steigung (95 %)',
    },
    ciError: 'Nicht verfügbar (Hintergrundrechnung nicht möglich).',
    error: {
      TOO_FEW_POINTS: 'Mindestens zwei Punkte nötig.',
      DEGENERATE_X: 'Alle x-Werte sind gleich.',
      UNKNOWN: 'Unerwarteter Fehler.',
    },
    help: {
      purpose:
        'Das Werkzeug legt eine Gerade nach der Methode der kleinsten Quadrate durch eine Punktwolke und zeigt, wie sicher ihre Steigung ist.',
      read: {
        plot: 'Die Punkte sind die Daten, die farbige Linie ist die angepasste Gerade. Zufällig erzeugte Punkte und deine eigenen Punkte gehen gleich in die Anpassung ein.',
        formula:
          'Die Formel zeigt die Gerade mit Achsenabschnitt und Steigung; darunter stehen beide Werte und R². R² nahe 1 heißt: die Gerade erklärt fast die gesamte Streuung.',
        bootstrap:
          'Das Intervall ist die mittlere 95-%-Spanne der Steigungen aus 1000 Neuziehungen der Punkte. Je breiter es ist, desto unsicherer ist die Steigung.',
      },
      controls: {
        n: 'Mit n legst du fest, wie viele Punkte zufällig erzeugt werden.',
        noise: 'Das Rauschen bestimmt, wie stark die Punkte um die wahre Gerade streuen.',
        seed: 'Der Seed wählt die Zufallszahlen aus: derselbe Seed ergibt immer dieselben Punkte.',
        click:
          'Ein Klick ins Diagramm oder der Knopf „Punkt hinzufügen“ setzt einen eigenen Punkt (höchstens 30). Ziehen oder die Pfeiltasten verschieben ihn, ein Rechtsklick oder Entf entfernt ihn; „Punkte zurücksetzen“ löscht alle.',
        bootstrap: 'Startet die Berechnung des Intervalls im Hintergrund; ändern sich die Punkte, wird das Ergebnis verworfen.',
      },
    },
  },
  scenario: {
    s1: {
      title: 'Wenige, stark verrauschte Punkte',
      short: 'n = 8, Rauschen 3: die Steigung wackelt',
      see: 'Nur 8 Punkte streuen stark um die wahre Gerade (Steigung 0,5). Die Ausgleichsgerade hat eine Steigung von etwa 0,34, R² ist nur 0,08.',
      watch:
        'Das Bootstrap-Intervall der Steigung reicht von etwa -0,27 bis 1,58 und enthält die 0: Die Daten zeigen nicht einmal sicher, ob die Gerade steigt. Es ist mehr als fünfmal so breit wie in der Standardansicht (0,26).',
      next: 'Erhöhe n schrittweise oder wähle einen anderen Seed und beobachte, wie sich Steigung und Intervall verändern.',
    },
    s2: {
      title: 'Ein Ausreißer zieht die Gerade',
      short: 'Ein Punkt bei (9, -3) weit unter der Wolke',
      see: 'Zu den 20 Punkten kommt ein Ausreißer bei (9, -3) hinzu. Die Steigung sinkt von 0,38 auf 0,20, R² von 0,53 auf 0,08.',
      watch:
        'Das Bootstrap-Intervall wird berechnet, sobald du hier ankommst. Mit einer Breite von 0,69 ist es mehr als doppelt so breit wie ohne den Ausreißer (0,26) und reicht bis -0,21, also unter 0.',
      next: 'Entferne den Ausreißer mit „Punkte zurücksetzen“ und vergleiche; setze ihn dann per Klick ins Diagramm wieder.',
    },
  },
}
