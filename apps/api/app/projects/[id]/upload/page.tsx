'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

type UploadResult = {
  candidateCount: number
}

type AssetEntry = {
  id: string
  fileName: string
  sizeBytes: number
}

export default function UploadPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [assets, setAssets] = useState<AssetEntry[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadAssets() {
      const response = await fetch(`/api/projects/${projectId}/assets`)
      if (!response.ok || ignore) return

      const data = (await response.json()) as { assets?: AssetEntry[] }
      if (!ignore) {
        setAssets(data.assets ?? [])
      }
    }

    void loadAssets()
    return () => {
      ignore = true
    }
  }, [projectId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0]

    if (!file) {
      setError('Bitte waehle ein Bild aus.')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let message = 'Upload fehlgeschlagen.'

      try {
        const data = (await response.json()) as { error?: string }
        if (typeof data.error === 'string') {
          message = data.error
        }
      } catch {
        // Keep fallback message if server response is not JSON.
      }

      setError(message)
      setUploading(false)
      return
    }

    const data = (await response.json()) as {
      candidateCount?: number
      candidates?: unknown[]
      asset?: AssetEntry
    }
    setResult({
      candidateCount: data.candidateCount ?? data.candidates?.length ?? 0,
    })
    const uploadedAsset = data.asset
    if (uploadedAsset) {
      setAssets((current) => [...current, uploadedAsset])
    }
    setUploading(false)
    form.reset()
  }

  async function handleDeleteAsset(assetId: string, fileName: string) {
    if (!confirm(`"${fileName}" wirklich loeschen?`)) {
      return
    }

    setDeletingId(assetId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/assets/${assetId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      setError('Foto konnte nicht geloescht werden.')
      setDeletingId(null)
      return
    }

    setAssets((current) => current.filter((asset) => asset.id !== assetId))
    setDeletingId(null)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f5f1e8 0%, #fffdf8 100%)',
        color: '#2d2a24',
      }}
    >
      <section
        style={{
          maxWidth: '44rem',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}
      >
        <Link href={`/projects/${projectId}`} style={backLinkStyle}>
          ← Zurück zum Projekt
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Bild-Upload</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Foto hochladen</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Lade ein einzelnes Bild hoch, damit ItemFlow erste Candidates für dieses Projekt
            erkennen kann.
          </p>
        </header>

        <section style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span>Bilddatei</span>
              <input
                name="file"
                type="file"
                accept="image/*"
                required
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={uploading}
              style={{
                border: 0,
                borderRadius: '999px',
                padding: '0.85rem 1rem',
                background: uploading ? '#8d8476' : '#1f6f5f',
                color: '#ffffff',
                fontWeight: 700,
                cursor: uploading ? 'progress' : 'pointer',
              }}
            >
              {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
            </button>
          </form>

          {error ? (
            <p
              role="alert"
              style={{
                marginTop: '1rem',
                marginBottom: 0,
                padding: '0.75rem 0.9rem',
                borderRadius: '0.75rem',
                background: '#fde9e7',
                color: '#9a2f1f',
              }}
            >
              {error}
            </p>
          ) : null}

          {result ? (
            <section style={successCardStyle}>
              <h2 style={{ marginTop: 0 }}>Upload erfolgreich</h2>
              <p style={{ marginTop: 0, lineHeight: 1.6 }}>
                Es wurden <strong>{result.candidateCount}</strong> Candidates erkannt.
              </p>
              <Link href={`/projects/${projectId}/candidates`} style={primaryLinkStyle}>
                Candidates prüfen
              </Link>
            </section>
          ) : null}

          {assets.length > 0 ? (
            <section style={{ marginTop: '2rem' }}>
              <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
                Hochgeladene Fotos ({assets.length})
              </h2>
              <ul style={assetListStyle}>
                {assets.map((asset) => (
                  <li key={asset.id} style={assetItemStyle}>
                    <span style={{ color: '#5c5346' }}>
                      {asset.fileName}
                      <span style={{ color: '#9b8f7b', marginLeft: '0.5rem' }}>
                        ({formatBytes(asset.sizeBytes)})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteAsset(asset.id, asset.fileName)}
                      disabled={deletingId === asset.id}
                      style={{
                        ...deleteButtonStyle,
                        cursor: deletingId === asset.id ? 'progress' : 'pointer',
                        opacity: deletingId === asset.id ? 0.7 : 1,
                      }}
                    >
                      {deletingId === asset.id ? '...' : 'Loeschen'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const backLinkStyle = {
  color: '#1f6f5f',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties

const cardStyle = {
  marginTop: '2rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffdf8',
  boxShadow: '0 0.75rem 1.5rem rgba(49, 40, 27, 0.05)',
} satisfies React.CSSProperties

const inputStyle = {
  width: '100%',
  padding: '0.8rem 0.9rem',
  borderRadius: '0.75rem',
  border: '1px solid #cfc5b6',
  background: '#ffffff',
  font: 'inherit',
  boxSizing: 'border-box',
} satisfies React.CSSProperties

const successCardStyle = {
  marginTop: '1rem',
  padding: '1rem',
  borderRadius: '0.9rem',
  background: '#eef8f3',
  border: '1px solid #cde6d8',
} satisfies React.CSSProperties

const assetListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.75rem',
} satisfies React.CSSProperties

const assetItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '0.9rem 1rem',
  borderRadius: '0.85rem',
  border: '1px solid #e4dccf',
  background: '#faf7f1',
} satisfies React.CSSProperties

const deleteButtonStyle = {
  border: '1px solid #d6cbbb',
  borderRadius: '999px',
  padding: '0.6rem 0.9rem',
  background: '#fff4f2',
  color: '#9a2f1f',
  fontWeight: 700,
} satisfies React.CSSProperties

const primaryLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.85rem 1rem',
  borderRadius: '999px',
  background: '#1f6f5f',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties
