import { getCurrentUser } from '@/lib/auth'
import { getAppUrl, getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.stripeCustomerId) {
      return Response.json({ error: 'No Stripe customer is linked to this account.' }, { status: 400 })
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: getAppUrl(request),
    })
    return Response.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error', error)
    return Response.json({ error: 'Unable to open billing portal.' }, { status: 500 })
  }
}
