'use client'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function DreamInput({ value, onChange, onSubmit, loading }: Props) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) onSubmit()
  }

  return (
    <div className="conversation-input">
      <div className="conversation-avatar" aria-hidden="true">D</div>
      <div className="dream-bubble">
        <label className="dream-bubble-label" htmlFor="dream-message">Tell me what you dream about</label>
        <input
          id="dream-message"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="I want to..."
          maxLength={500}
          disabled={loading}
          aria-label="Tell me your dream"
        />
        <button
          onClick={onSubmit}
          disabled={loading || value.trim().length === 0}
          aria-label="Send dream"
          title="Send dream"
        >
          {loading ? <span className="send-loading" /> : <span aria-hidden="true">↑</span>}
        </button>
      </div>
    </div>
  )
}
