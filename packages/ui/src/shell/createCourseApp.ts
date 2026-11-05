import { createApp, type App } from 'vue'
import { registerMessages, type CourseDefinition } from '@whz-ds-labs/lab-kit'
import { installKitMessages } from '../kitMessages'
import LabShell from './LabShell.vue'

/** Course entry point: installs the kit texts, registers every lab's texts and returns the app (mount it yourself). */
export function createCourseApp(course: CourseDefinition): App {
  installKitMessages()
  for (const lab of course.labs) registerMessages(lab.id, lab.messages)
  return createApp(LabShell, { course })
}
