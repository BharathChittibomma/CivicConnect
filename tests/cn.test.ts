import { describe, expect, it } from 'vitest'
import { cn } from '../src/lib/utils'


describe('cn', () => {
  it('merges className strings', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})

