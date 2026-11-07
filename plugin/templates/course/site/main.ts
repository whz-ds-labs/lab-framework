import 'katex/dist/katex.min.css'
import '@whz-ds-labs/ui/tokens.css'
import '@whz-ds-labs/ui/style.css'
import { createCourseApp } from '@whz-ds-labs/ui'
import { course } from './course'

createCourseApp(course).mount('#app')
