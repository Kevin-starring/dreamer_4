import type { DreamSchedule } from '@/lib/schedules'
import { deleteQstashSchedule, escapeHtml, getRedis, localDateInTimezone, sendEmail } from '@/lib/schedules'

export async function POST(request: Request) {
  const redis = getRedis()
  if (!redis) return Response.json({ error: 'Not configured' }, { status: 503 })

  try {
    const body = await request.json()
    const id = String(body.id ?? '')
    const token = String(body.token ?? '')
    const schedule = await redis.get<DreamSchedule>(`schedule:${id}`)
    if (!schedule || schedule.status !== 'active' || schedule.reminderToken !== token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = localDateInTimezone(schedule.timezone)
    const activeTasks = schedule.tasks.filter(task => task.startDate <= today && task.endDate >= today)
    if (activeTasks.length === 0) {
      const finalDate = schedule.tasks.reduce((latest, task) => task.endDate > latest ? task.endDate : latest, '')
      if (finalDate && today > finalDate) {
        await deleteQstashSchedule(schedule.qstashScheduleId)
        await redis.del(`schedule:${schedule.id}`)
      }
      return Response.json({ ok: true, sent: false })
    }

    const taskList = activeTasks.map(task =>
      `<li style="margin:8px 0"><strong>${escapeHtml(task.name)}</strong><br><span style="color:#7b879d;font-size:12px">${task.startDate} to ${task.endDate}</span></li>`
    ).join('')
    await sendEmail(
      schedule.email,
      `Today's Dream Realizer action plan`,
      `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#18213a">
        <p style="color:#5d62e8;font-weight:bold">DAILY ACTION PLAN</p>
        <h2>${escapeHtml(schedule.dream)}</h2>
        <p>Keep your dream moving with today's active actions:</p>
        <ul>${taskList}</ul>
      </div>`
    )

    return Response.json({ ok: true, sent: true, tasks: activeTasks.length })
  } catch {
    return Response.json({ error: 'Reminder failed' }, { status: 500 })
  }
}
