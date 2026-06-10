import 'server-only'

import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured.')
  if (!stripe) stripe = new Stripe(secretKey)
  return stripe
}

export function getAppUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured) return configured
  if (request) return new URL(request.url).origin
  throw new Error('NEXT_PUBLIC_APP_URL is not configured.')
}
