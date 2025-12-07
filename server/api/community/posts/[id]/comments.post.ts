import { createComment, upsertUser } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
    const user = requireUser(event)
    const postId = getRouterParam(event, 'id')
    if (!postId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing Post ID' })
    }

    const body = await readBody(event)
    if (!body.body) {
        throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
    }

    await upsertUser({ id: user.id, name: user.name, role: user.role })

    const newComment = await createComment({
        postId,
        body: body.body,
        authorId: user.id
    })

    return newComment
})
