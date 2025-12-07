import crypto from 'node:crypto'

type Bundle = {
  id: string
  filename: string
  mime: string
  buffer: Buffer
  createdAt: number
}

const bundles = new Map<string, Bundle>()
const TTL_MS = 1000 * 60 * 30 // 30 minutes

export function saveBundle(filename: string, mime: string, buffer: Buffer): { id: string; path: string } {
  cleanupExpired()
  const id = crypto.randomBytes(12).toString('hex')
  bundles.set(id, {
    id,
    filename,
    mime,
    buffer,
    createdAt: Date.now()
  })
  return { id, path: `/api/quickstart/bundle?id=${id}` }
}

export function getBundle(id: string): Bundle | null {
  const b = bundles.get(id)
  if (!b) return null
  if (Date.now() - b.createdAt > TTL_MS) {
    bundles.delete(id)
    return null
  }
  return b
}

function cleanupExpired() {
  const now = Date.now()
  for (const [id, b] of bundles.entries()) {
    if (now - b.createdAt > TTL_MS) {
      bundles.delete(id)
    }
  }
}
