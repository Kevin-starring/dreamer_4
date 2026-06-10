import { createHash, randomBytes } from 'crypto'
import { Redis } from '@upstash/redis'

export interface ScheduledTask {
  name: string
  startDate: string
  endDate: string
}

export interface DreamSchedule {
  id: string
  dream: string
  email: string
  time: string
  timezone: string
  timezoneOffset: number
  tasks: ScheduledTask[]
  status: 'pending' | 'active'
  verificationToken: string
  reminderToken: string
  qstashScheduleId?: string
  createdAt: string
}

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export function scheduleId(email: string, dream: string): string {
  return createHash('sha256').update(`${email.toLowerCase()}:${dream.trim()}`).digest('hex').slice(0, 24)
}

export function newToken(): string {
  return randomBytes(24).toString('hex')
}

export function dailyUtcCron(time: string, timezoneOffset: number): string {
  const [hour, minute] = time.split(':').map(Number)
  const utcMinutes = ((hour * 60 + minute + timezoneOffset) % 1440 + 1440) % 1440
  return `${utcMinutes % 60} ${Math.floor(utcMinutes / 60)} * * *`
}

export async function createQstashSchedule(schedule: DreamSchedule, origin: string): Promise<string> {
  if (!process.env.QSTASH_TOKEN) throw new Error('QStash is not configured')

  const destination = `${origin}/api/reminders/send`
  const response = await fetch(`https://qstash.upstash.io/v2/schedules/${encodeURIComponent(destination)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      'Upstash-Cron': dailyUtcCron(schedule.time, schedule.timezoneOffset),
      'Upstash-Retries': '2',
    },
    body: JSON.stringify({ id: schedule.id, token: schedule.reminderToken }),
  })

  if (!response.ok) throw new Error('Could not create reminder schedule')
  const data = await response.json() as { scheduleId?: string }
  if (!data.scheduleId) throw new Error('Missing QStash schedule id')
  return data.scheduleId
}

export async function deleteQstashSchedule(id?: string): Promise<void> {
  if (!id || !process.env.QSTASH_TOKEN) return
  await fetch(`https://qstash.upstash.io/v2/schedules/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
  }).catch(() => {})
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.REMINDER_FROM_EMAIL) {
    throw new Error('Email delivery is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.REMINDER_FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) throw new Error('Could not send email')
}

export function localDateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character)
}
