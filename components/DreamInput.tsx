'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>
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

  useEffect(() => () => recognitionRef.current?.stop(), [])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) onSubmit()
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
    recognition.interimResults = false
    recognition.lang = speechLanguages[language]
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) onChange([value.trim(), transcript].filter(Boolean).join(' ').slice(0, 500))
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
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
