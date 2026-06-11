'use client'

import { useMemo, useState, useEffect, useSyncExternalStore, type MouseEvent } from 'react'
import type { Tool } from '@/lib/types'
import { fillPrompt } from '@/lib/fillPrompt'
import { matchBestPrompt } from '@/lib/matchBestPrompt'
import { useLanguage } from '@/components/LanguageProvider'

interface Props {
  tool: Tool | null
  useCase?: string
  nodeName?: string | null
  dream?: string
  isCompleted?: boolean
  onToggleComplete?: (nodeName: string) => void
}

type Rating = 'like' | 'dislike'
interface CustomPromptData { prompt: string; steps: string[] }
interface CustomPromptResult {
  requestKey: string
  data: CustomPromptData | null
  failed: boolean
}

const RATINGS_KEY = 'dreamer_ratings'
const RATINGS_EVENT = 'dreamer-ratings-change'
const MOBILE_TOOL_URLS: Record<string, string> = {
  chatgpt: 'https://chatgpt.com/',
  claude: 'https://claude.ai/new',
  runway: 'https://app.runwayml.com/',
  elevenlabs: 'https://elevenlabs.io/app/speech-synthesis',
  gamma: 'https://gamma.app/',
  perplexity: 'https://www.perplexity.ai/',
  capcut: 'https://www.capcut.com/editor',
  'notion-ai': 'https://www.notion.so/',
  figma: 'https://www.figma.com/files/',
  suno: 'https://suno.com/create',
}

function getRatingsSnapshot(): string {
  return localStorage.getItem(RATINGS_KEY) ?? '{}'
}

function subscribeToRatings(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(RATINGS_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(RATINGS_EVENT, callback)
  }
}

function saveRatings(ratings: Record<string, Rating>) {
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings))
    window.dispatchEvent(new Event(RATINGS_EVENT))
  } catch { /* localStorage unavailable */ }
}

export default function ToolPanel({ tool, useCase, nodeName, dream, isCompleted, onToggleComplete }: Props) {
  const { language, t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [customResult, setCustomResult] = useState<CustomPromptResult | null>(null)

  const ratingsSnapshot = useSyncExternalStore(subscribeToRatings, getRatingsSnapshot, () => '{}')
  const ratings = useMemo<Record<string, Rating>>(() => {
    try { return JSON.parse(ratingsSnapshot) } catch { return {} }
  }, [ratingsSnapshot])

  // Non-English prompts are generated live even when the roadmap came from the English cache.
  const isLiveNode = !!tool && (useCase === undefined || language !== 'en')
  const toolId = tool?.id
  const toolName = tool?.name
  const toolDescription = tool?.description
  const liveRequestKey = isLiveNode && toolId && nodeName && dream
    ? JSON.stringify([dream, nodeName, toolId, toolName, toolDescription, language])
    : null

  useEffect(() => {
    if (!liveRequestKey || !toolId || !toolName || !toolDescription || !nodeName || !dream) return

    let cancelled = false

    fetch('/api/tool-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dream,
        taskName: nodeName,
        toolId,
        toolName,
        toolDescription,
        language,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          if (data.prompt && Array.isArray(data.steps)) {
            setCustomResult({
              requestKey: liveRequestKey,
              data: { prompt: data.prompt, steps: data.steps },
              failed: false,
            })
          } else {
            setCustomResult({ requestKey: liveRequestKey, data: null, failed: true })
          }
        }
      })
      .catch(() => {
        if (!cancelled) setCustomResult({ requestKey: liveRequestKey, data: null, failed: true })
      })

    return () => { cancelled = true }
  }, [liveRequestKey, toolId, toolName, toolDescription, nodeName, dream, language])

  const currentCustomResult = customResult?.requestKey === liveRequestKey ? customResult : null
  const customPrompt = currentCustomResult?.data ?? null
  const customFailed = currentCustomResult?.failed ?? false
  const customLoading = liveRequestKey !== null && currentCustomResult === null

  // Golden-path: exact useCase match, or keyword-based fallback
  const staticPrompt = !isLiveNode && tool
    ? (tool.prompts.find(p => p.useCase === useCase) ?? matchBestPrompt(tool, nodeName))
    : null

  // When live fetch fails, show matchBestPrompt as graceful fallback
  const fallbackPrompt = isLiveNode && customFailed && tool
    ? matchBestPrompt(tool, nodeName)
    : null

  const activePromptData = isLiveNode
    ? (customPrompt ?? (fallbackPrompt ? { prompt: fallbackPrompt.prompt, steps: fallbackPrompt.steps } : null))
    : (staticPrompt ? { prompt: staticPrompt.prompt, steps: staticPrompt.steps } : null)

  const ratingKey = tool && activePromptData
    ? `${tool.id}:${isLiveNode ? (nodeName ?? 'live') : (staticPrompt?.useCase ?? 'unknown')}:${nodeName ?? ''}`
    : null
  const rating = ratingKey ? ratings[ratingKey] ?? null : null

  if (!tool) {
    return (
      <div className="tool-panel tool-panel--empty" id="tool-recommendation">
        <div className="tool-panel-hint">
          <p>{t('toolHint')}</p>
        </div>
      </div>
    )
  }

  if (!isLiveNode && !staticPrompt) return null

  const promptText = activePromptData ? fillPrompt(activePromptData.prompt, dream ?? '') : null
  const steps = activePromptData?.steps ?? []

  const handleCopy = async () => {
    if (!promptText) return
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard not available */ }
  }

  const track = () => {
    const hash = btoa(tool.id).slice(0, 16)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: tool.id, dreamHash: hash }),
    }).catch(() => {})
  }

  const handleOpenTool = (event: MouseEvent<HTMLAnchorElement>) => {
    track()

    const isMobile = window.matchMedia('(max-width: 980px)').matches
    if (!isMobile) return

    // Same-tab universal links let installed mobile apps claim the URL.
    event.preventDefault()
    window.location.assign(MOBILE_TOOL_URLS[tool.id] ?? tool.url)
  }

  const handleToggle = () => {
    if (nodeName && onToggleComplete) onToggleComplete(nodeName)
  }

  const handleRate = (value: Rating) => {
    if (!ratingKey) return
    const next = rating === value ? null : value
    const updated = { ...ratings }
    if (next === null) delete updated[ratingKey]
    else updated[ratingKey] = next
    saveRatings(updated)
  }

  return (
    <div className="tool-panel" id="tool-recommendation">
      <div className="tool-header">
        <div className="tool-logo">{tool.emoji}</div>
        <div>
          <div className="tool-name">{tool.name}</div>
          <div className="tool-category">{tool.category}</div>
        </div>
      </div>

      {nodeName && onToggleComplete && (
        <button
          className={`complete-btn ${isCompleted ? 'complete-btn--done' : ''}`}
          onClick={handleToggle}
        >
          {isCompleted ? `✅ ${t('undoComplete')}` : `☐ ${t('complete')}`}
        </button>
      )}

      <p className="tool-desc">{tool.description}</p>

      <div className="prompt-section">
        <div className="prompt-label">{t('recommendedPrompt')}</div>
        {customLoading ? (
          <div className="prompt-generating">
            <span className="prompt-spinner" />
            {t('generatingPrompt')}
          </div>
        ) : promptText ? (
          <>
            <div className="prompt-box">
              <pre>{promptText}</pre>
              <button
                className="copy-btn"
                onClick={handleCopy}
                aria-label="Copy prompt to clipboard"
              >
                {copied ? `✅ ${t('copied')}` : `📋 ${t('copy')}`}
              </button>
            </div>
            {promptText.includes('[') && (
              <p className="placeholder-note">Replace text in [BRACKETS] with your details</p>
            )}
          </>
        ) : null}
      </div>

      <a
        className="open-btn"
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpenTool}
      >
        Open in {tool.name} →
      </a>

      {steps.length > 0 && (
        <div className="guide-section">
          <h4>{t('howToUse')} {tool.name}</h4>
          {steps.map((step, i) => (
            <div key={i} className="guide-step">
              <span>Step {i + 1}:</span> {step}
            </div>
          ))}
        </div>
      )}

      <div className="guide-section">
        <h4>{t('whyTool')}</h4>
        <p className="why-text">{tool.why}</p>
      </div>

      {ratingKey && (
        <div className="rating-section">
          <div className="rating-label">Was this recommendation helpful?</div>
          <div className="rating-buttons">
            <button
              className={`rating-btn rating-btn--like${rating === 'like' ? ' rating-btn--active' : ''}`}
              onClick={() => handleRate('like')}
              aria-label="Mark recommendation as helpful"
            >
              <span className="rating-icon">👍</span>
              {rating === 'like' ? 'Helpful!' : 'Helpful'}
            </button>
            <button
              className={`rating-btn rating-btn--dislike${rating === 'dislike' ? ' rating-btn--active' : ''}`}
              onClick={() => handleRate('dislike')}
              aria-label="Mark recommendation as not helpful"
            >
              <span className="rating-icon">👎</span>
              {rating === 'dislike' ? 'Not helpful' : 'Not helpful'}
            </button>
          </div>
          {rating && (
            <p className="rating-feedback">
              {rating === 'like'
                ? 'Thanks for the feedback! Glad it helped. 🎉'
                : 'Thanks for letting us know. Click again to undo.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
