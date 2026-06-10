import { getCurrentUser, toPublicUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  return Response.json({ user: user ? toPublicUser(user) : null })
}
