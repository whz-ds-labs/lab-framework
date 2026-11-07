import { defineLab } from '@whz-ds-labs/lab-kit'
import { de } from './i18n/de'
import { en } from './i18n/en'
import { lineTool } from './tools/lineTool'

export const lab = defineLab({
  id: '%%topic%%',
  title: { de: '%%topicTitleDe%%', en: '%%topicTitleEn%%' },
  summary: {
    de: 'Beispiel-Lab: Ausgleichsgerade mit Bootstrap-Intervall. Ersetze es durch dein Thema.',
    en: 'Example lab: least squares line with a bootstrap interval. Replace it with your topic.',
  },
  tools: [lineTool],
  messages: { de, en },
})
