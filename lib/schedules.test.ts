import { describe, expect, it } from 'vitest'
import { dailyUtcCron, escapeHtml, localDateInTimezone } from './schedules'

describe('dailyUtcCron', () => {
  it('converts Singapore local time to UTC', () => {
    expect(dailyUtcCron('09:30', -480)).toBe('30 1 * * *')
  })

  it('wraps UTC conversion across midnight', () => {
    expect(dailyUtcCron('23:15', 300)).toBe('15 4 * * *')
  })
})

describe('schedule helpers', () => {
  it('formats a date in the requested timezone', () => {
    expect(localDateInTimezone('Asia/Singapore', new Date('2026-06-09T17:00:00Z'))).toBe('2026-06-10')
  })

  it('escapes user content before placing it in email HTML', () => {
    expect(escapeHtml(`<script>"test" & 'x'</script>`)).toBe('&lt;script&gt;&quot;test&quot; &amp; &#039;x&#039;&lt;/script&gt;')
  })
})
