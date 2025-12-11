import { defineEventHandler, getCookie, sendRedirect } from 'h3'

const publicPaths = ['/login', '/api/auth/login', '/api/auth/callback', '/api/auth/logout', '/topology']

export default defineEventHandler((event) => {
  const path = event.path

  if (publicPaths.some(p => path.startsWith(p))) {
    return
  }

  if (path.startsWith('/api/') || path.startsWith('/_nuxt/') || path.startsWith('/logo/') || path.includes('.')) {
    return
  }

  const sessionUser = getCookie(event, 'session_user')
  if (!sessionUser && !path.startsWith('/login')) {
    return sendRedirect(event, '/login')
  }
})
