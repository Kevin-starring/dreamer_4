'use client'

import { LANGUAGES, type LanguageCode } from '@/lib/i18n'
import { useLanguage } from '@/components/LanguageProvider'

export default function LanguageMenu() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <label className="language-menu">
      <span className="sr-only">{t('language')}</span>
      <select
        aria-label={t('language')}
        value={language}
        onChange={event => setLanguage(event.target.value as LanguageCode)}
      >
        {LANGUAGES.map(item => (
          <option key={item.code} value={item.code}>{item.flag} {item.label}</option>
        ))}
      </select>
    </label>
  )
}
