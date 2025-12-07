import { getPosts } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
    const posts = await getPosts()
    const tags = new Set<string>()

    posts.forEach(p => {
        p.tags.forEach(t => tags.add(t))
    })

    return Array.from(tags).sort()
})
