'use client'

import { useEffect, useRef, useState } from 'react'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n'
import { useLanguage } from '@/components/LanguageProvider'

function FlagIcon({ code }: { code: LanguageCode }) {
  const common = {
    className: 'language-flag',
    viewBox: '0 0 28 20',
    role: 'img',
    'aria-hidden': true,
  } as const

  if (code === 'en') return (
    <svg {...common}>
      <rect width="28" height="20" fill="#fff" />
      {[0, 4, 8, 12, 16].map(y => <rect key={y} y={y} width="28" height="2" fill="#b22234" />)}
      <rect width="12" height="11" fill="#3c3b6e" />
      <g fill="#fff">{[2, 6, 10].flatMap(x => [2, 5, 8].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r=".6" />))}</g>
    </svg>
  )

  if (code === 'zh') return (
    <svg {...common}>
      <rect width="28" height="20" fill="#de2910" />
      <path d="m5 3 .8 2.2h2.3L6.2 6.6 7 8.8 5 7.5 3 8.8l.8-2.2-1.9-1.4h2.3z" fill="#ffde00" />
      <g fill="#ffde00"><circle cx="10" cy="3" r=".8" /><circle cx="12" cy="6" r=".8" /><circle cx="12" cy="10" r=".8" /><circle cx="9.5" cy="12" r=".8" /></g>
    </svg>
  )

  if (code === 'ko') return (
    <svg {...common}>
      <rect width="28" height="20" fill="#fff" />
      <path d="M10 10a4 4 0 0 1 8 0 2 2 0 0 1-4 0 2 2 0 0 0-4 0" fill="#cd2e3a" />
      <path d="M18 10a4 4 0 0 1-8 0 2 2 0 0 1 4 0 2 2 0 0 0 4 0" fill="#0047a0" />
      <g stroke="#111" strokeWidth=".8"><path d="m5 4 3 2m-4 0 3 2m13-2 3-2m-2 4 3-2M5 16l3-2m-4 0 3-2m13 2 3 2m-2-4 3 2" /></g>
    </svg>
  )

  if (code === 'ja') return (
    <svg {...common}>
      <rect width="28" height="20" fill="#fff" />
      <circle cx="14" cy="10" r="5" fill="#bc002d" />
    </svg>
  )

  if (code === 'es') return (
    <svg {...common}>
      <rect width="28" height="20" fill="#aa151b" />
      <rect y="5" width="28" height="10" fill="#f1bf00" />
      <rect x="7" y="8" width="2.5" height="4" rx=".5" fill="#aa151b" />
    </svg>
  )

  return (
    <svg {...common}>
      <rect width="28" height="20" fill="#a51931" />
      <rect y="3" width="28" height="14" fill="#f4f5f8" />
      <rect y="6" width="28" height="8" fill="#2d2a4a" />
    </svg>
  )
}

export default function LanguageMenu() {
  const { language, setLanguage, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const selected = LANGUAGES.find(item => item.code === language) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const chooseLanguage = (code: LanguageCode) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div className="language-menu" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('language')}
        className="language-trigger"
        onClick={() => setOpen(value => !value)}
        type="button"
      >
        <FlagIcon code={selected.code} />
        <span>{selected.label}</span>
        <span className="language-chevron" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="language-options" role="listbox" aria-label={t('language')}>
          {LANGUAGES.map(item => (
            <button
              aria-selected={item.code === language}
              className={item.code === language ? 'language-option language-option--active' : 'language-option'}
              key={item.code}
              onClick={() => chooseLanguage(item.code)}
              role="option"
              type="button"
            >
              <FlagIcon code={item.code} />
              <span>{item.label}</span>
              {item.code === language && <span className="language-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
