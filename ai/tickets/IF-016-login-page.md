# IF-016-login-page

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Login-Seite implementieren — `apps/api/app/login/page.tsx` mit E-Mail/Passwort-Formular
das NextAuth v5 Credentials-Provider nutzt. Ohne diese Seite ist die App im Browser
nicht testbar, da die Middleware alle `/api/*`-Routen schützt.

---

## Kontext

- Auth: `apps/api/auth.ts` — `signIn` aus `next-auth/react`, `pages: { signIn: '/login' }` bereits konfiguriert
- Middleware: `apps/api/middleware.ts` — schützt `/api/*`, leitet unauthentifizierte Requests auf `/login` um
- NextAuth v5 (beta.31) — Client-seitiges `signIn('credentials', { ... })` aus `next-auth/react`
- Kein UI-Framework bisher — einfaches HTML mit inline Tailwind-ähnlichen Klassen oder plain CSS

---

## Ziel

Nach diesem Ticket kann sich ein Nutzer einloggen und die App ist im Browser
end-to-end testbar. Die Seite muss funktional sein, kein poliertes Design nötig.

---

## Betroffene Dateien

```
apps/api/app/login/page.tsx      NEU — Login-Formular (Client Component)
apps/api/app/page.tsx            ÄNDERN — einfache Startseite nach Login
```

---

## Implementierungsdetails

### `apps/api/app/login/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-Mail oder Passwort ungültig.')
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <main>
      <h1>ItemFlow — Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password">Passwort</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Bitte warten…' : 'Einloggen'}
        </button>
      </form>
    </main>
  )
}
```

### `apps/api/app/page.tsx`

Einfache Startseite die nach erfolgreichem Login erscheint — zeigt Session-Daten
und Links zu den API-Endpunkten:

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <main>
      <h1>ItemFlow</h1>
      <p>Eingeloggt als: {session.user.email}</p>
    </main>
  )
}
```

---

## Akzeptanzkriterien

- [ ] `/login` zeigt Formular mit E-Mail + Passwort
- [ ] Erfolgreicher Login mit `dev@itemflow.local` / `dev-password` leitet auf `/` um
- [ ] Falsches Passwort zeigt Fehlermeldung — kein Crash, kein leerer Screen
- [ ] `/` zeigt eingeloggte E-Mail-Adresse
- [ ] Unauthentifizierter Zugriff auf `/` leitet auf `/login` um
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `redirect: false` bei `signIn` — manuelle Fehlerbehandlung statt NextAuth-Redirect
- Kein externes UI-Framework — plain HTML + minimales Inline-Styling reicht
- `session.user.userId` und `session.user.email` sind über `auth()` verfügbar (IF-006)
- Dev-Credentials aus Seed: `dev@itemflow.local` / `dev-password`

---

## Abhängigkeiten

- IF-006 (NextAuth Setup) — merged ✓
- IF-005 (Seed) — Dev-User muss in DB existieren

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Poliertes UI oder CSS-Framework
- Registrierung / Passwort-Reset
- OAuth-Login
- Session-Anzeige im Header

---

## Referenzen

Review: REVIEW-IF-016 (nach Implementierung)
