import { createSession, getUserByEmail, hashPassword, saveUser, toPublicUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (await getUserByEmail(email)) {
      return Response.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const passwordData = await hashPassword(password)
    const user = {
      email,
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
      createdAt: new Date().toISOString(),
    }
    await saveUser(user)
    await createSession(email)
    return Response.json({ user: toPublicUser(user) }, { status: 201 })
  } catch {
    return Response.json({ error: 'Unable to create account.' }, { status: 500 })
  }
}
