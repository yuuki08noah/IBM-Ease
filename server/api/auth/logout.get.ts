import { defineEventHandler, setCookie, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  setCookie(event, 'session_user', '', { expires: new Date(0), path: '/' })
  setCookie(event, 'session_token', '', { expires: new Date(0), path: '/' })
  setCookie(event, 'session_refresh', '', { expires: new Date(0), path: '/' })
  setCookie(event, 'pkce_verifier', '', { expires: new Date(0), path: '/' })

  return sendRedirect(event, '/login')
})
