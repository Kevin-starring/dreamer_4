'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES, translate, type LanguageCode, type TranslationKey } from '@/lib/i18n'

interface LanguageContextValue {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('en')

  useEffect(() => {
    const saved = localStorage.getItem('dreamer_language') as LanguageCode | null
    if (!saved || !LANGUAGES.some(item => item.code === saved)) return
    const timer = window.setTimeout(() => setLanguage(saved), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem('dreamer_language', language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: TranslationKey) => translate(language, key),
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}
