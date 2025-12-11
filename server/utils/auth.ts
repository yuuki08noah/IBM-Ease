import type { H3Event } from 'h3'
import { getCookie, createError } from 'h3'

export interface User {
  id: string
  name: string
  email?: string
  role: 'user' | 'expert' | 'ibm'
  provider?: 'ibm' | 'google'
}

export function getUser(event: H3Event): User | null {
  const userCookie = getCookie(event, 'session_user')
  if (!userCookie) return null

  try {
    const jsonString = Buffer.from(userCookie, 'base64').toString('utf-8')
    const user = JSON.parse(jsonString)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      provider: user.provider
    }
  } catch {
    return null
  }
}

export function requireUser(event: H3Event): User {
  const user = getUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  return user
}

export function getAccessToken(event: H3Event): string | null {
  return getCookie(event, 'session_token') || null
}

export function requireAccessToken(event: H3Event): string {
  const token = getAccessToken(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No access token'
    })
  }
  return token
}
