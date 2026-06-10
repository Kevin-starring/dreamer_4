import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchExa, formatExaResults } from './exaSearch'

describe('searchExa', () => {
  const originalKey = process.env.EXA_API_KEY
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.EXA_API_KEY = 'test-key'
  })

  afterEach(() => {
    process.env.EXA_API_KEY = originalKey
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns [] when EXA_API_KEY is not set', async () => {
    delete process.env.EXA_API_KEY
    global.fetch = vi.fn()
    const results = await searchExa('become a doctor')
    expect(results).toEqual([])
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns parsed results on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { title: 'Med School Guide', url: 'https://example.com/a', summary: 'How to apply.' },
          { title: null, url: 'https://example.com/b', summary: 'Missing title, filtered out' },
        ],
      }),
    })

    const results = await searchExa('become a doctor')
    expect(results).toEqual([
      { title: 'Med School Guide', url: 'https://example.com/a', summary: 'How to apply.' },
    ])
  })

  it('returns [] on non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const results = await searchExa('become a doctor')
    expect(results).toEqual([])
  })

  it('returns [] when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'))
    const results = await searchExa('become a doctor')
    expect(results).toEqual([])
  })
})

describe('formatExaResults', () => {
  it('returns empty string for no results', () => {
    expect(formatExaResults([])).toBe('')
  })

  it('formats results into a context block', () => {
    const text = formatExaResults([
      { title: 'Med School Guide', url: 'https://example.com/a', summary: 'How to apply.' },
    ])
    expect(text).toContain('Med School Guide')
    expect(text).toContain('How to apply.')
  })
})
