'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'

interface SpeechRecognitionResultLike {
  0?: { transcript: string }
  isFinal?: boolean
  item?: (index: number) => { transcript: string } | null
}

interface SpeechRecognitionEventLike {
  resultIndex?: number
  results: ArrayLike<SpeechRecognitionResultLike> & {
    item?: (index: number) => SpeechRecognitionResultLike | null
  }
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const speechLanguages = {
  en: 'en-US',
  zh: 'zh-CN',
  ko: 'ko-KR',
  ja: 'ja-JP',
  es: 'es-ES',
  th: 'th-TH',
} as const

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function DreamInput({ value, onChange, onSubmit, loading }: Props) {
  const { language, t } = useLanguage()
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const speechBaseValueRef = useRef('')
  const touchDragRef = useRef({ x: 0, y: 0, scrollLeft: 0, dragging: false })

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) onSubmit()
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLInputElement>) => {
    const touch = event.touches[0]
    touchDragRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    }
  }

  const handleTouchMove = (event: React.TouchEvent<HTMLInputElement>) => {
    const touch = event.touches[0]
    const drag = touchDragRef.current
    const deltaX = touch.clientX - drag.x
    const deltaY = touch.clientY - drag.y

    if (!drag.dragging && Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY)) {
      drag.dragging = true
    }
    if (!drag.dragging) return

    event.preventDefault()
    event.currentTarget.scrollLeft = drag.scrollLeft - deltaX
  }

  const toggleSpeech = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Recognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = speechLanguages[language]
    speechBaseValueRef.current = value.trim()
    recognition.onresult = event => {
      const transcripts: string[] = []

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index] ?? event.results.item?.(index)
        const alternative = result?.[0] ?? result?.item?.(0)
        if (alternative?.transcript) transcripts.push(alternative.transcript)
      }

      const transcript = transcripts.join(' ').trim()
      if (transcript) {
        onChange([speechBaseValueRef.current, transcript].filter(Boolean).join(' ').slice(0, 500))
      }
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognition.onerror = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognitionRef.current = recognition
    setListening(true)
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setListening(false)
    }
  }

  return (
    <div className="conversation-input">
      <div className="conversation-avatar" aria-hidden="true">D</div>
      <div className="dream-bubble">
        <label className="dream-bubble-label" htmlFor="dream-message">{t('tellDream')}</label>
        <input
          id="dream-message"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          placeholder={t('dreamPlaceholder')}
          maxLength={500}
          disabled={loading}
          aria-label={t('tellDream')}
        />
        <button
          className={`dream-voice-btn ${listening ? 'dream-voice-btn--active' : ''}`}
          onClick={toggleSpeech}
          disabled={loading || !speechSupported}
          aria-label={listening ? t('stopListening') : t('voiceInput')}
          title={speechSupported ? (listening ? t('stopListening') : t('voiceInput')) : t('voiceUnsupported')}
          type="button"
        >
          <span aria-hidden="true">{listening ? '■' : '🎙'}</span>
        </button>
        <button
          className="dream-send-btn"
          onClick={onSubmit}
          disabled={loading || value.trim().length === 0}
          aria-label={t('sendDream')}
          title={t('sendDream')}
          type="button"
        >
          {loading ? <span className="send-loading" /> : <span aria-hidden="true">↑</span>}
        </button>
      </div>
    </div>
  )
}
