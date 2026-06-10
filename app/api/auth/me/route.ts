import { getCurrentUser, toPublicUser } from '@/lib/auth'
import { syncSubscription } from '@/lib/subscription'

export async function GET() {
  const user = await getCurrentUser()
  if (user?.stripeCustomerId && !user.subscriptionStatus) {
    try {
      await syncSubscription(user)
    } catch (error) {
      console.error('Stripe subscription sync error', error)
    }
  }
  return Response.json({ user: user ? toPublicUser(user) : null })
}
