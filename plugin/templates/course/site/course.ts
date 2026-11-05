import { defineCourse } from '@whz-ds-labs/lab-kit'
// ds-labs:lab-imports

export const course = defineCourse({
  id: '%%course%%',
  title: { de: '%%courseTitleDe%%', en: '%%courseTitleEn%%' },
  lead: {
    de: 'Interaktive Lernwerkzeuge zum Kurs.',
    en: 'Interactive learning tools for the course.',
  },
  labs: [
    // ds-labs:lab-list
  ],
  roadmap: [],
})
