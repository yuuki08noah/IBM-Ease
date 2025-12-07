import { createPost, upsertUser } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const body = await readBody(event)

    if (!body.title || !body.body) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing required fields'
        })
    }

    // Ensure user in DB stats (redundant if me.get called but safe)
    await upsertUser({ id: user.id, name: user.name, role: user.role })

    // Sanitize tags
    const tags = Array.isArray(body.tags) ? body.tags : []

    const newPost = await createPost({
        title: body.title,
        body: body.body,
        authorId: user.id, // Use real ID
        tags
    })

    return newPost
})
