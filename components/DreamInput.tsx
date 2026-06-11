'use client'

import { useLanguage } from '@/components/LanguageProvider'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function DreamInput({ value, onChange, onSubmit, loading }: Props) {
  const { t } = useLanguage()
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) onSubmit()
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
          onClick={onSubmit}
          disabled={loading || value.trim().length === 0}
          aria-label={t('sendDream')}
          title={t('sendDream')}
        >
          {loading ? <span className="send-loading" /> : <span aria-hidden="true">↑</span>}
        </button>
      </div>
    </div>
  )
}
