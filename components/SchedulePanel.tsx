'use client'

import { useMemo, useState } from 'react'
import type { TreeNode } from '@/lib/types'

interface ScheduleTask {
  name: string
  startDate: string
  endDate: string
}

interface Props {
  treeData: TreeNode
  dream: string
}

function getLeafNames(node: TreeNode): string[] {
  if (!node.children?.length) return node.toolId ? [node.name] : []
  return node.children.flatMap(getLeafNames)
}

function localDate(daysFromToday = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function dateFromValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function EnglishDatePicker({
  value,
  min,
  onChange,
}: {
  value: string
  min?: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = dateFromValue(value)
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const firstDay = visibleMonth.getDay()
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1
  )

  const selectDay = (day: number) => {
    const next = dateValue(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
    if (!min || next >= min) {
      onChange(next)
      setOpen(false)
    }
  }

  return (
    <div className="english-date-picker">
      <button type="button" className="date-picker-trigger" onClick={() => setOpen(current => !current)}>
        {dateFromValue(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </button>
      {open && (
        <div className="date-picker-popover">
          <div className="date-picker-header">
            <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
            <strong>{visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
            <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="date-picker-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span className="date-picker-weekday" key={day}>{day}</span>)}
            {cells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} />
              const currentValue = dateValue(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
              return (
                <button
                  type="button"
                  key={currentValue}
                  disabled={!!min && currentValue < min}
                  className={currentValue === value ? 'date-picker-day date-picker-day--selected' : 'date-picker-day'}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SchedulePanel({ treeData, dream }: Props) {
  const leafNames = useMemo(() => getLeafNames(treeData), [treeData])
  const [email, setEmail] = useState('')
  const [time, setTime] = useState('09:00')
  const [tasks, setTasks] = useState<ScheduleTask[]>(() =>
    leafNames.map((name, index) => ({
      name,
      startDate: localDate(index),
      endDate: localDate(index + 6),
    }))
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateTask = (name: string, field: 'startDate' | 'endDate', value: string) => {
    setTasks(prev => prev.map(task => task.name === name ? { ...task, [field]: value } : task))
  }

  const handleSave = async () => {
    setError(null)
    setMessage(null)

    if (!email.trim()) {
      setError('Enter the email address that should receive reminders.')
      return
    }

    const invalidTask = tasks.find(task => !task.startDate || !task.endDate || task.startDate > task.endDate)
    if (invalidTask) {
      setError(`Check the date range for "${invalidTask.name}".`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream,
          email: email.trim(),
          time,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset(),
          tasks,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error ?? 'Could not save your schedule.')
        return
      }
      setMessage(data.message ?? 'Check your email to activate daily reminders.')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="schedule-panel" aria-label="Action plan schedule" lang="en-US">
      <div className="schedule-header">
        <div>
          <h2>Schedule your action plan</h2>
          <p>Choose the active date range for each action. We will email you every day at the selected time.</p>
        </div>
        <div className="schedule-delivery">
          <label>
            Reminder email
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            Daily reminder time (24-hour)
            <input
              type="text"
              inputMode="numeric"
              pattern="(?:[01]\d|2[0-3]):[0-5]\d"
              placeholder="09:00"
              value={time}
              onChange={event => setTime(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="schedule-tasks">
        {tasks.map(task => (
          <div className="schedule-task" key={task.name}>
            <strong>{task.name}</strong>
            <label>
              Start
              <EnglishDatePicker
                value={task.startDate}
                onChange={value => updateTask(task.name, 'startDate', value)}
              />
            </label>
            <span className="schedule-date-separator">to</span>
            <label>
              End
              <EnglishDatePicker
                min={task.startDate}
                value={task.endDate}
                onChange={value => updateTask(task.name, 'endDate', value)}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="schedule-actions">
        <span className="schedule-timezone">Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
        {error && <span className="schedule-error">{error}</span>}
        {message && <span className="schedule-success">{message}</span>}
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving schedule...' : 'Save & verify email'}
        </button>
      </div>
    </section>
  )
}
