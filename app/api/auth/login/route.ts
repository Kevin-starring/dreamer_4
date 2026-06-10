import { createSession, getUserByEmail, toPublicUser, verifyPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const user = await getUserByEmail(email)

    if (!user || !(await verifyPassword(password, user))) {
      return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 })
    }

    await createSession(user.email)
    return Response.json({ user: toPublicUser(user) })
  } catch {
    return Response.json({ error: 'Unable to sign in.' }, { status: 500 })
  }
}
