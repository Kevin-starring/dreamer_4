'use client'

import { useEffect, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const THEME_EVENT = 'dreamer-theme-change'

function getTheme(): Theme {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

function getServerTheme(): Theme {
  return 'light'
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(THEME_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(THEME_EVENT, callback)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    window.dispatchEvent(new Event(THEME_EVENT))
  }

  return { theme, toggleTheme }
}
