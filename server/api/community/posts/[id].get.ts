import { getPostById, getCommentsByPostId } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
    }

    const post = await getPostById(id)
    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    const comments = await getCommentsByPostId(id)

    return {
        ...post,
        answers: comments // Return as 'answers' to match UI terminology if needed, or just 'comments'
    }
})
