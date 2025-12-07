import crypto from 'node:crypto'

export function generateCodeVerifier(): string {
  return base64Url(crypto.randomBytes(32))
}

export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest()
  return base64Url(hash)
}

function base64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
