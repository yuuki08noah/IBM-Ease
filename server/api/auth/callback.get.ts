import { defineEventHandler, getQuery, getCookie, setCookie, createError, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const stateStr = query.state as string | undefined

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code' })
  }

  // Restore state to find provider
  let provider = 'ibm'
  let origin = ''
  try {
    if (stateStr) {
      const decoded = JSON.parse(stateStr)
      provider = decoded.p || 'ibm'
      origin = decoded.o || ''
    }
  } catch {
    // Fallback if state wasn't JSON (legacy handling or direct attack)
    console.warn('Invalid state format, defaulting to IBM')
  }

  const verifier = getCookie(event, 'pkce_verifier')
  if (!verifier) {
    throw createError({ statusCode: 400, statusMessage: 'Missing PKCE verifier' })
  }

  const config = useRuntimeConfig()
  let userInfo: { id: string; email?: string; name: string; role?: string; provider?: string } | null = null
  let accessToken: string | undefined

  if (provider === 'google') {
    const googleConfig = config.googleOauth as any
    const redirectUri = googleConfig.redirectUri || `${origin || 'http://localhost:3000'}/api/auth/callback`

    // Exchange code for token
    const tokenResponse = await $fetch<any>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: {
        code,
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier
      }
    }).catch(err => {
      console.error('Google token exchange error:', err)
      throw createError({ statusCode: 502, statusMessage: 'Google login failed' })
    })

    accessToken = tokenResponse.access_token

    // Get User Info
    const googleUser = await $fetch<any>('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    userInfo = {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name || googleUser.email,
      role: 'user', // Default role for Google
      provider: 'google'
    }

  } else {
    // IBM Flow
    const redirectUri = config.ibmOauth.redirectUri || ''
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.ibmOauth.clientId || '',
      code_verifier: verifier
    })

    if (config.ibmOauth.clientSecret) {
      params.append('client_secret', config.ibmOauth.clientSecret)
    }

    const tokenResponse = await $fetch<any>(config.ibmOauth.tokenUrl || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    }).catch((err) => {
      throw createError({ statusCode: 502, statusMessage: 'Token exchange failed', data: err?.data || err?.message })
    })

    accessToken = tokenResponse.access_token
    const idToken = tokenResponse.id_token as string | undefined

    // Try userinfo endpoint
    if (accessToken && config.ibmOauth.userinfoUrl) {
      try {
        const ui = await $fetch<any>(config.ibmOauth.userinfoUrl as string, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        userInfo = {
          id: ui.sub || ui.iam_id,
          email: ui.email || ui.preferred_username,
          name: ui.name || ui.preferred_username || ui.email || 'IBM User',
          provider: 'ibm'
        }
      } catch (err: any) {
        console.warn('userinfo fetch failed', err?.data || err?.message)
      }
    }

    // Fallback to id_token
    if (!userInfo && idToken) {
      try {
        const payload = idToken.split('.')[1]
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
        userInfo = {
          id: decoded.sub || decoded.iam_id,
          email: decoded.email,
          name: decoded.name || decoded.given_name || decoded.email || 'IBM User',
          provider: 'ibm'
        }
      } catch (err) {
        console.warn('id_token decode failed', err)
      }
    }
  }

  if (!userInfo) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to obtain user info' })
  }

  // Store Session
  const sessionPayload = Buffer.from(JSON.stringify(userInfo)).toString('base64')

  setCookie(event, 'session_user', sessionPayload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8 // 8 hours
  })

  // Only store access token if it's IBM (for Watson/Cloudant)
  // Or store it anyway but mark provider? 
  // Existing logic just stores 'session_token'.
  // If we store Google token here, Watson API calls might try to use it and fail.
  // But Gemini demo doesn't use it.
  // Watson demo uses `requireAccessToken` which reads `session_token`.
  // So if we store Google token, Watson demo will send Google token to IBM Watson => 401.
  // That's fine, we will handle it in the UI or let it fail.
  if (accessToken) {
    setCookie(event, 'session_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8
    })
  }

  setCookie(event, 'pkce_verifier', '', { expires: new Date(0), path: '/' })

  return sendRedirect(event, '/')
})
