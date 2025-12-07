import { getPosts } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const search = (query.search as string)?.toLowerCase()
    const tag = query.tag as string
    const solved = query.solved === 'true'

    let posts = await getPosts()

    if (search) {
        posts = posts.filter(p =>
            p.title.toLowerCase().includes(search) ||
            p.body.toLowerCase().includes(search)
        )
    }

    if (tag) {
        posts = posts.filter(p => p.tags.includes(tag))
    }

    if (solved) {
        posts = posts.filter(p => p.solved)
    }

    // Sort by newest first
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return posts
})
