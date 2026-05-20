import { describe, expect, it } from 'vitest'

import { DEFAULT_AUTO_ACCEPT_THRESHOLD, shouldAutoAccept } from './auto-accept.js'

describe('shouldAutoAccept', () => {
  it('accepts when confidence equals threshold', () => {
    expect(shouldAutoAccept(0.85, 0.85)).toBe(true)
  })

  it('accepts when confidence exceeds threshold', () => {
    expect(shouldAutoAccept(0.95, 0.85)).toBe(true)
  })

  it('rejects when confidence is below threshold', () => {
    expect(shouldAutoAccept(0.7, 0.85)).toBe(false)
  })

  it('accepts all when threshold is 0', () => {
    expect(shouldAutoAccept(0, 0)).toBe(true)
  })

  it('only accepts perfect confidence at threshold 1', () => {
    expect(shouldAutoAccept(0.99, 1)).toBe(false)
    expect(shouldAutoAccept(1, 1)).toBe(true)
  })

  it('default threshold boundary', () => {
    expect(shouldAutoAccept(DEFAULT_AUTO_ACCEPT_THRESHOLD, DEFAULT_AUTO_ACCEPT_THRESHOLD)).toBe(true)
    expect(shouldAutoAccept(DEFAULT_AUTO_ACCEPT_THRESHOLD - 0.01, DEFAULT_AUTO_ACCEPT_THRESHOLD)).toBe(false)
  })
})
