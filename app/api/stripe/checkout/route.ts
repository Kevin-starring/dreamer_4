import { getCurrentUser, saveUser } from '@/lib/auth'
import { getAppUrl, getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return Response.json({ error: 'Sign in before upgrading.' }, { status: 401 })
    if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
      return Response.json({ error: 'Your Pro subscription is already active.' }, { status: 409 })
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID
    if (!priceId) throw new Error('STRIPE_PRO_PRICE_ID is not configured.')

    const stripe = getStripe()
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userEmail: user.email },
      })
      customerId = customer.id
      user.stripeCustomerId = customerId
      await saveUser(user)
    }

    const appUrl = getAppUrl(request)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${appUrl}/?payment=success`,
      cancel_url: `${appUrl}/?payment=canceled`,
      subscription_data: { metadata: { userEmail: user.email } },
    })

    return Response.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error', error)
    return Response.json({ error: 'Unable to start checkout.' }, { status: 500 })
  }
}
