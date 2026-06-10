'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PublicUser } from '@/lib/auth'

type AuthMode = 'login' | 'register'

export default function AccountPanel() {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [mode, setMode] = useState<AuthMode>('login')
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(response => response.json())
      .then(data => setUser(data.user))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!open) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  async function submitAuth(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setUser(data.user)
      setOpen(false)
      setPassword('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function openStripe(path: 'checkout' | 'portal') {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/stripe/${path}`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Something went wrong.')
      setOpen(true)
      setLoading(false)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setOpen(false)
  }

  return (
    <div className="account-panel">
      {user ? (
        <>
          <span className={`plan-badge ${user.isPro ? 'plan-badge--pro' : ''}`}>
            {user.isPro ? 'Pro' : 'Free'}
          </span>
          <button className="account-trigger" onClick={() => setOpen(value => !value)}>
            {user.email}
          </button>
        </>
      ) : (
        <button className="account-trigger" onClick={() => setOpen(value => !value)}>Sign in</button>
      )}

      {open && createPortal(
        <div className="account-backdrop" onClick={() => setOpen(false)}>
          <div
            aria-modal="true"
            className="account-popover"
            onClick={event => event.stopPropagation()}
            role="dialog"
          >
            {user ? (
              <>
                <strong>{user.email}</strong>
                <p>{user.isPro ? 'Your Pro subscription is active.' : 'Upgrade to unlock Pro features.'}</p>
                {!user.isPro && (
                  <button className="account-primary" disabled={loading} onClick={() => openStripe('checkout')}>
                    Upgrade to Pro
                  </button>
                )}
                {user.stripeCustomerId && (
                  <button className="account-secondary" disabled={loading} onClick={() => openStripe('portal')}>
                    Manage billing
                  </button>
                )}
                <button className="account-secondary" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <div className="account-tabs">
                  <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
                  <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
                </div>
                <form onSubmit={submitAuth}>
                  <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" required />
                  <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password (8+ characters)" required minLength={8} />
                  <button className="account-primary" disabled={loading}>
                    {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                </form>
              </>
            )}
            {error && <p className="account-error">{error}</p>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
