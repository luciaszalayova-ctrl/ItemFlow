'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function QuickStartButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      setLoading(false)
      return
    }

    const data = (await response.json()) as { project: { id: string } }
    router.push(`/projects/${data.project.id}/upload`)
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.85rem 1.25rem',
        borderRadius: '999px',
        background: loading ? '#8d8476' : '#2d5fa3',
        color: '#ffffff',
        border: 0,
        fontWeight: 700,
        cursor: loading ? 'progress' : 'pointer',
        fontSize: '1rem',
      }}
    >
      {loading ? 'Wird angelegt...' : '⚡ Direkt starten'}
    </button>
  )
}
