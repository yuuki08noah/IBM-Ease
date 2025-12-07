import { toggleVote } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    requireUser(event) // Enforce login
    const body = await readBody(event)
    const { type, id, increment } = body

    if (!['post', 'comment'].includes(type) || !id || typeof increment !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: 'Invalid vote payload' })
    }

    const newVotes = await toggleVote(type as 'post' | 'comment', id, increment)
    return { votes: newVotes }
})
