import { defineEventHandler, getCookie, setCookie, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'session_refresh')
  if (!refreshToken) {
    throw createError({ statusCode: 401, statusMessage: 'No refresh token' })
  }

  const config = useRuntimeConfig()
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.ibmOauth.clientId || ''
  })

  if (config.ibmOauth.clientSecret) {
    params.append('client_secret', config.ibmOauth.clientSecret)
  }

  const tokenResponse = await $fetch<any>(config.ibmOauth.tokenUrl || '', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  }).catch((err) => {
    throw createError({ statusCode: 502, statusMessage: 'Token refresh failed', data: err?.data || err?.message })
  })

  const newAccessToken = tokenResponse.access_token
  const newRefreshToken = tokenResponse.refresh_token || refreshToken

  setCookie(event, 'session_token', newAccessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60
  })

  setCookie(event, 'session_refresh', newRefreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })

  return { success: true, expiresIn: tokenResponse.expires_in }
})
