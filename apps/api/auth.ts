import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@itemflow/db'

declare module 'next-auth' {
  interface Session {
    user: { userId: string; email: string } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') return null

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, passwordHash: true },
        })
        if (!user?.passwordHash) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.userId = user.id
      return token
    },
    session({ session, token }) {
      if (typeof token.userId === 'string') {
        session.user.userId = token.userId
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
