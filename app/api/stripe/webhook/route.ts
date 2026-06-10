import type Stripe from 'stripe'
import { getUserByEmail, saveUser, stripeCustomerKey } from '@/lib/auth'
import { getRedis } from '@/lib/redis'
import { getStripe } from '@/lib/stripe'

async function updateSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
  const mappedEmail = await getRedis().get<string>(stripeCustomerKey(customerId))
  const email = subscription.metadata.userEmail || mappedEmail
  if (!email) return

  const user = await getUserByEmail(email)
  if (!user) return

  user.stripeCustomerId = customerId
  user.stripeSubscriptionId = subscription.id
  user.subscriptionStatus = subscription.status
  const periodEnd = subscription.items.data[0]?.current_period_end
  user.subscriptionCurrentPeriodEnd = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : undefined
  await saveUser(user)
}

async function linkCheckoutSession(session: Stripe.Checkout.Session) {
  const email = session.client_reference_id
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (!email || !customerId) return

  const user = await getUserByEmail(email)
  if (!user) return
  user.stripeCustomerId = customerId
  await saveUser(user)
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return new Response('Webhook is not configured.', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch (error) {
    console.error('Stripe webhook signature error', error)
    return new Response('Invalid signature.', { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await linkCheckoutSession(event.data.object)
    } else if (
      event.type === 'customer.subscription.created'
      || event.type === 'customer.subscription.updated'
      || event.type === 'customer.subscription.deleted'
    ) {
      await updateSubscription(event.data.object)
    }
    return Response.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook handler error', error)
    return new Response('Webhook handler failed.', { status: 500 })
  }
}
