import 'server-only'

import type Stripe from 'stripe'
import { getUserByEmail, saveUser, stripeCustomerKey, type UserRecord } from '@/lib/auth'
import { getRedis } from '@/lib/redis'
import { getStripe } from '@/lib/stripe'

export async function applySubscription(user: UserRecord, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
  const periodEnd = subscription.items.data[0]?.current_period_end

  user.stripeCustomerId = customerId
  user.stripeSubscriptionId = subscription.id
  user.subscriptionStatus = subscription.status
  user.subscriptionCurrentPeriodEnd = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : undefined
  await saveUser(user)
}

export async function updateSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
  const mappedEmail = await getRedis().get<string>(stripeCustomerKey(customerId))
  const email = subscription.metadata.userEmail || mappedEmail
  if (!email) return

  const user = await getUserByEmail(email)
  if (user) await applySubscription(user, subscription)
}

export async function syncSubscription(user: UserRecord) {
  if (!user.stripeCustomerId) return user

  const subscriptions = await getStripe().subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'all',
    limit: 10,
  })
  const subscription = subscriptions.data.find(item =>
    item.status === 'active' || item.status === 'trialing',
  ) ?? subscriptions.data[0]

  if (subscription) await applySubscription(user, subscription)
  return user
}
