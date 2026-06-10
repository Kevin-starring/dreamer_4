import type { DreamSchedule, ScheduledTask } from '@/lib/schedules'
import { getRedis, newToken, scheduleId, sendEmail, escapeHtml } from '@/lib/schedules'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export async function POST(request: Request) {
  const redis = getRedis()
  if (!redis || !process.env.QSTASH_TOKEN || !process.env.RESEND_API_KEY || !process.env.REMINDER_FROM_EMAIL) {
    return Response.json({ error: 'Schedule reminders are not configured on this deployment yet.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const dream = String(body.dream ?? '').trim().slice(0, 300)
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 254)
    const time = String(body.time ?? '')
    const timezone = String(body.timezone ?? '').slice(0, 80)
    const timezoneOffset = Number(body.timezoneOffset)
    const tasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 40).map((task: ScheduledTask) => ({
      name: String(task.name ?? '').trim().slice(0, 180),
      startDate: String(task.startDate ?? ''),
      endDate: String(task.endDate ?? ''),
    })) : []

    const tasksValid = tasks.length > 0 && tasks.every((task: ScheduledTask) =>
      task.name && DATE_PATTERN.test(task.startDate) && DATE_PATTERN.test(task.endDate) && task.startDate <= task.endDate
    )
    if (!dream || !EMAIL_PATTERN.test(email) || !TIME_PATTERN.test(time) || !timezone || !Number.isFinite(timezoneOffset) || !tasksValid) {
      return Response.json({ error: 'Invalid schedule details.' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
    const rateKey = `schedule-rate:${ip}`
    const attempts = await redis.incr(rateKey)
    if (attempts === 1) await redis.expire(rateKey, 60 * 60)
    if (attempts > 8) return Response.json({ error: 'Too many schedule requests. Try again later.' }, { status: 429 })

    const id = scheduleId(email, dream)
    const existing = await redis.get<DreamSchedule>(`schedule:${id}`)
    const schedule: DreamSchedule = {
      id,
      dream,
      email,
      time,
      timezone,
      timezoneOffset,
      tasks,
      status: 'pending',
      verificationToken: newToken(),
      reminderToken: existing?.reminderToken ?? newToken(),
      qstashScheduleId: existing?.qstashScheduleId,
      createdAt: new Date().toISOString(),
    }
    await redis.set(`schedule:${id}`, schedule, { ex: 60 * 60 * 24 * 365 })

    const origin = new URL(request.url).origin
    const verificationUrl = `${origin}/api/schedules/confirm?id=${encodeURIComponent(id)}&token=${encodeURIComponent(schedule.verificationToken)}`
    await sendEmail(
      email,
      'Confirm your Dream Realizer reminders',
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#18213a">
        <h2>Confirm your daily action plan reminders</h2>
        <p>Dream: <strong>${escapeHtml(dream)}</strong></p>
        <p>You asked for reminders at <strong>${escapeHtml(time)}</strong> (${escapeHtml(timezone)}).</p>
        <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#5d62e8;color:white;text-decoration:none;border-radius:8px">Activate reminders</a></p>
        <p style="color:#7b879d;font-size:12px">Only activate this schedule if you requested it.</p>
      </div>`
    )

    return Response.json({ ok: true, message: 'Check your email and activate the reminder schedule.' })
  } catch {
    return Response.json({ error: 'Could not save the schedule.' }, { status: 500 })
  }
}
