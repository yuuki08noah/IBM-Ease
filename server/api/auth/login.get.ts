import { defineEventHandler, getRequestURL, setCookie, createError, getQuery, sendRedirect } from 'h3'
import { generateCodeVerifier, generateCodeChallenge } from '../../lib/pkce'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const provider = (query.provider as string) || 'ibm'

  // Common PKCE setup
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)

  setCookie(event, 'pkce_verifier', verifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  const origin = getRequestURL(event).origin
  // Encode provider in state so callback knows who to verify with
  const state = JSON.stringify({ p: provider, o: origin })

  if (provider === 'google') {
    if (!config.googleOauth?.clientId) {
      throw createError({ statusCode: 500, statusMessage: 'Google OAuth not configured' })
    }
    const redirectUri = config.googleOauth.redirectUri || `${origin}/api/auth/callback`

    const params = new URLSearchParams({
      client_id: config.googleOauth.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      access_type: 'offline'
    })

    return { redirect: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` }
  }

  // Default to IBM
  if (!config.ibmOauth?.clientId || !config.ibmOauth?.authorizeUrl) {
    throw createError({ statusCode: 500, statusMessage: 'IBM OAuth not configured' })
  }

  const redirectUri = config.ibmOauth.redirectUri || `${origin}/api/auth/callback`
  const authorizeUrl = new URL(config.ibmOauth.authorizeUrl)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', config.ibmOauth.clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', config.ibmOauth.scope || 'openid profile email')
  authorizeUrl.searchParams.set('code_challenge', challenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')
  authorizeUrl.searchParams.set('state', state)

  return { redirect: authorizeUrl.toString() }
})
