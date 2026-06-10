import type Stripe from 'stripe'
import { getUserByEmail, saveUser } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { updateSubscription } from '@/lib/subscription'

async function linkCheckoutSession(session: Stripe.Checkout.Session) {
  const email = session.client_reference_id
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (!email || !customerId) return

  const user = await getUserByEmail(email)
  if (!user) return
  user.stripeCustomerId = customerId
  await saveUser(user)

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id
  if (subscriptionId) {
    await updateSubscription(await getStripe().subscriptions.retrieve(subscriptionId))
  }
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
