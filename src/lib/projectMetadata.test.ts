import { describe, expect, it } from 'vitest'
import { homeMetadata } from './projectMetadata'

describe('project metadata', () => {
  it('keeps stable home metadata', () => {
    expect(homeMetadata.ogUrl).toBe('https://minhyeok328.github.io/')
  })
})
