export interface ExaResult {
  title: string
  url: string
  summary: string
}

interface ExaApiResult {
  title?: string | null
  url?: string
  summary?: string | null
}

interface ExaApiResponse {
  results?: ExaApiResult[]
}

/**
 * Searches Exa for current, real-world information related to the dream.
 * Returns an empty array on any failure (missing key, timeout, API error)
 * so the caller can proceed without grounding context.
 */
export async function searchExa(query: string, timeoutMs = 6000): Promise<ExaResult[]> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query,
        type: 'auto',
        numResults: 5,
        contents: { summary: true },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })

    if (!res.ok) {
      console.error(`Exa search failed: ${res.status}`)
      return []
    }

    const data = (await res.json()) as ExaApiResponse
    return (data.results ?? [])
      .filter((r): r is { title: string; url: string; summary: string } =>
        Boolean(r.title && r.url && r.summary)
      )
      .map(r => ({ title: r.title, url: r.url, summary: r.summary }))
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      console.error('Exa search timeout')
    } else {
      console.error('Exa search error:', e.message)
    }
    return []
  }
}

export function formatExaResults(results: ExaResult[]): string {
  if (results.length === 0) return ''

  const items = results
    .map((r, i) => `${i + 1}. ${r.title}\n${r.summary.slice(0, 400)}`)
    .join('\n\n')

  return `Here is current, real-world information related to this dream (use it to ground the plan in realistic, up-to-date details — do not output URLs in your response):\n\n${items}\n\n---\n\n`
}
