import type de from './de'

type Messages<T> = { [K in keyof T]: T[K] extends string ? string : Messages<T[K]> }

const en: Messages<typeof de> = {
  nav: {
    home: 'Home',
    label: 'Tools',
  },
  lang: {
    toggle: 'Switch language',
  },
  notice: {
    invalidUrl: 'The address contains invalid values. Showing the default view instead.',
    dismiss: 'Dismiss notice',
  },
  url: {
    noticeTitle: 'Note on the address',
    noticeIntro: 'Some values in the address were corrected:',
    problem: '{param}: invalid or out of range, the default or the nearest allowed value is used.',
  },
  scenario: {
    barLabel: 'Ready-made scenarios to try',
    noteSee: 'What you see',
    noteWatch: 'What to watch for',
    noteNext: 'Try this next',
    changed: 'You have changed the settings.',
    restore: 'Restore scenario',
    close: 'Close scenario note',
  },
  help: {
    button: 'Help',
    heading: 'Help: {tool}',
    close: 'Close help',
    purposeTitle: 'What it is for',
    readTitle: 'How to read the view',
    controlsTitle: 'Controls',
    courseTitle: 'In the course',
    scenariosTitle: 'Scenarios',
    scenariosHint: 'Ready-made states to try, each with a short explanation.',
  },
  ref: {
    badge: 'Textbook ch. {chapter} · Notebook cell {code}',
    badgeNoCode: 'Textbook ch. {chapter}',
  },
  plot: {
    point: 'Point',
  },
  status: {
    loading: 'Computing …',
    empty: 'No data available.',
    error: 'Error:',
    progress: '{done} of {total}',
  },
  home: {
    toolsTitle: 'Tools',
    goal: 'Learning goal',
    open: 'Open {tool}',
    noticeTitle: 'Notice',
  },
}

export default en
