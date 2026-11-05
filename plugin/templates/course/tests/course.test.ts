import { catalogParity, missingLabMessages } from '@whz-ds-labs/lab-kit/testing'
import { defineCourse } from '@whz-ds-labs/lab-kit'
import { describe, expect, it } from 'vitest'
import { course } from '../site/course'

describe('course definition', () => {
  it('validates', () => {
    expect(() => defineCourse(course)).not.toThrow()
    expect(course.title.de).not.toBe('')
    expect(course.title.en).not.toBe('')
  })

  it('has complete DE and EN texts for every lab', () => {
    for (const lab of course.labs) {
      expect(missingLabMessages(lab), `${lab.id}: missing messages`).toEqual([])
      expect(catalogParity(lab.messages.de, lab.messages.en), `${lab.id}: catalog parity`).toEqual([])
    }
  })
})
