import type { DreamSchedule } from '@/lib/schedules'
import { createQstashSchedule, deleteQstashSchedule, escapeHtml, getRedis } from '@/lib/schedules'

function confirmationPage(message: string, success: boolean): Response {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
    <title>Dream Realizer reminder</title></head>
    <body style="font-family:Arial,sans-serif;background:#f7fbff;color:#18213a;padding:48px">
      <main style="max-width:560px;margin:auto;background:white;border:1px solid #dcecf7;border-radius:16px;padding:28px">
        <h1 style="font-size:24px">${success ? 'Reminders activated' : 'Could not activate reminders'}</h1>
        <p>${escapeHtml(message)}</p>
      </main>
    </body></html>`, { status: success ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export async function GET(request: Request) {
  const redis = getRedis()
  if (!redis) return confirmationPage('Reminder storage is not configured.', false)

  const url = new URL(request.url)
  const id = url.searchParams.get('id') ?? ''
  const token = url.searchParams.get('token') ?? ''
  const schedule = await redis.get<DreamSchedule>(`schedule:${id}`)
  if (!schedule || !token || schedule.verificationToken !== token) {
    return confirmationPage('This confirmation link is invalid or expired.', false)
  }

  try {
    await deleteQstashSchedule(schedule.qstashScheduleId)
    const qstashScheduleId = await createQstashSchedule(schedule, url.origin)
    const activeSchedule = { ...schedule, status: 'active' as const, qstashScheduleId, verificationToken: '' }
    await redis.set(`schedule:${id}`, activeSchedule, { ex: 60 * 60 * 24 * 365 })
    return confirmationPage(`Daily reminders will be sent to ${schedule.email} at ${schedule.time} (${schedule.timezone}).`, true)
  } catch {
    return confirmationPage('The reminder service could not activate this schedule. Please try saving it again.', false)
  }
}
