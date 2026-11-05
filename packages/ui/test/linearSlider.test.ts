import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LinearSlider from '../src/LinearSlider.vue'

describe('LinearSlider', () => {
  it('exposes the formatted value as aria-valuetext', () => {
    const w = mount(LinearSlider, {
      props: { modelValue: 20, min: 1, max: 20, step: 1, label: 'Tiefe', format: (v: number) => (v >= 20 ? 'unbegrenzt' : String(v)) },
    })
    expect(w.find('input').attributes('aria-valuetext')).toBe('unbegrenzt')
    expect(w.find('output').text()).toBe('unbegrenzt')
  })

  it('falls back to the plain number without a formatter', () => {
    const w = mount(LinearSlider, { props: { modelValue: 5, min: 1, max: 20, step: 1, label: 'x' } })
    expect(w.find('input').attributes('aria-valuetext')).toBe('5')
  })

  it('emits the numeric value on input', async () => {
    const w = mount(LinearSlider, { props: { modelValue: 5, min: 1, max: 20, step: 1, label: 'x' } })
    await w.find('input').setValue('7')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([7])
  })
})
