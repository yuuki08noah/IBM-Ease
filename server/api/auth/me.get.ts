import { getUser } from '~/server/utils/auth'
import { upsertUser } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = getUser(event) // from cookie

  if (user) {
    // Optionally ensure they are in our local DB stats
    // We do this async usually or here to catch first-time users from OAuth
    await upsertUser({
      id: user.id || user.email || 'unknown',
      name: user.name,
      role: user.role
    })
  }

  return { user }
})
