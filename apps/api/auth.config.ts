import type { NextAuthConfig } from 'next-auth'

// Edge-Runtime-kompatible Basiskonfiguration — kein bcryptjs, kein Prisma.
// Wird in middleware.ts importiert. Die vollständige Konfiguration mit
// Credentials-Provider liegt in auth.ts.
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  session: { strategy: 'jwt' as const },
} satisfies NextAuthConfig