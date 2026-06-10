import 'server-only'

import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'
import { getRedis } from '@/lib/redis'

const scrypt = promisify(scryptCallback)
const SESSION_COOKIE = 'dream_realizer_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export type SubscriptionStatus =
  | 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  | 'incomplete' | 'incomplete_expired' | 'paused' | null

export type UserRecord = {
  email: string
  passwordHash: string
  passwordSalt: string
  createdAt: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionStatus?: SubscriptionStatus
  subscriptionCurrentPeriodEnd?: string
}

export type PublicUser = {
  email: string
  stripeCustomerId: string | null
  subscriptionStatus: SubscriptionStatus
  subscriptionCurrentPeriodEnd: string | null
  isPro: boolean
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const userKey = (email: string) => `auth:user:${normalizeEmail(email)}`
const sessionKey = (token: string) => `auth:session:${createHash('sha256').update(token).digest('hex')}`
export const stripeCustomerKey = (customerId: string) => `auth:stripe-customer:${customerId}`

export async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return { hash: derived.toString('hex'), salt }
}

export async function verifyPassword(password: string, user: UserRecord) {
  const { hash } = await hashPassword(password, user.passwordSalt)
  const actual = Buffer.from(hash, 'hex')
  const expected = Buffer.from(user.passwordHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function getUserByEmail(email: string) {
  return getRedis().get<UserRecord>(userKey(email))
}

export async function saveUser(user: UserRecord) {
  await getRedis().set(userKey(user.email), user)
  if (user.stripeCustomerId) await getRedis().set(stripeCustomerKey(user.stripeCustomerId), user.email)
}

export async function createSession(email: string) {
  const token = randomBytes(32).toString('base64url')
  await getRedis().set(sessionKey(token), normalizeEmail(email), { ex: SESSION_TTL_SECONDS })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) await getRedis().del(sessionKey(token))
  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const email = await getRedis().get<string>(sessionKey(token))
  return email ? getUserByEmail(email) : null
}

export function toPublicUser(user: UserRecord): PublicUser {
  const status = user.subscriptionStatus ?? null
  return {
    email: user.email,
    stripeCustomerId: user.stripeCustomerId ?? null,
    subscriptionStatus: status,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
    isPro: status === 'active' || status === 'trialing',
  }
}
