import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'

export const maxDuration = 30

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function cacheKey(toolId: string, dream: string, taskName: string): string {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 100)
  return `tp:${toolId}:${norm(dream)}:${norm(taskName)}`
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export async function POST(request: Request) {
  let dream: string, taskName: string, toolId: string, toolName: string, toolDescription: string

  try {
    const body = await request.json()
    dream = String(body.dream ?? '').trim()
    taskName = String(body.taskName ?? '').trim()
    toolId = String(body.toolId ?? '').trim()
    toolName = String(body.toolName ?? '').trim()
    toolDescription = String(body.toolDescription ?? '').trim()
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!dream || !taskName || !toolId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const redis = getRedis()
  const key = cacheKey(toolId, dream, taskName)

  if (redis) {
    try {
      const cached = await redis.get<{ prompt: string; steps: string[] }>(key)
      if (cached?.prompt && Array.isArray(cached?.steps)) {
        return Response.json({ ...cached, fromCache: true })
      }
    } catch { /* cache miss — proceed to API */ }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI service not configured' }, { status: 503 })
  }

  try {
    const message = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `You generate focused AI tool prompts for specific tasks in a dream roadmap.
Output ONLY a valid JSON object with no markdown, no explanation:
{"prompt":"...","steps":["...","...",...]}`,
        messages: [{
          role: 'user',
          content: `Dream goal: ${dream}
Task: ${taskName}
Tool: ${toolName} — ${toolDescription}

Generate:
- "prompt": 2-4 sentence actionable prompt the user should paste into ${toolName}. Use [BRACKETS] for placeholders they must fill in.
- "steps": 3-4 step-by-step instructions for using ${toolName} to complete this specific task.`,
        }],
      },
      { signal: AbortSignal.timeout(7000) }
    )

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    let parsed: { prompt: string; steps: string[] }
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
      parsed = JSON.parse(match[0])
    }

    if (!parsed.prompt || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return Response.json({ error: 'Invalid response structure' }, { status: 500 })
    }

    const result = { prompt: parsed.prompt, steps: parsed.steps }

    if (redis) {
      redis.set(key, result, { ex: 60 * 60 * 24 * 30 }).catch(() => {})
    }

    return Response.json({ ...result, fromCache: false })
  } catch (err: unknown) {
    const e = err as { name?: string }
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      return Response.json({ error: 'Request timed out' }, { status: 504 })
    }
    return Response.json({ error: 'AI service error' }, { status: 500 })
  }
}
