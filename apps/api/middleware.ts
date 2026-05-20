import NextAuth from 'next-auth'

import { authConfig } from './auth.config'

export default NextAuth(authConfig).auth((req: { auth?: unknown }) => {
  if (!req.auth) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
})

export const config = {
  matcher: ['/api/((?!auth).*)'],
}
