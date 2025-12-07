import { join } from 'path'
import { promises as fs } from 'fs'

const DATA_DIR = join(process.cwd(), 'server/data')
const DB_PATH = join(DATA_DIR, 'community.json')

export interface User {
    id: string
    name: string
    role: 'user' | 'expert' | 'ibm'
    reputation: number
    badges: string[]
    certified: boolean
    avatarUrl?: string
}

export interface Post {
    id: string
    title: string
    body: string
    authorId: string
    tags: string[]
    votes: number
    views: number
    solved: boolean
    createdAt: string // ISO string
}

export interface Comment {
    id: string
    postId: string
    body: string
    authorId: string
    votes: number
    accepted: boolean
    ibmVerified: boolean
    createdAt: string // ISO string
}

export interface DBData {
    users: User[]
    posts: Post[]
    comments: Comment[]
}

async function ensureDir() {
    await fs.mkdir(DATA_DIR, { recursive: true })
}

export async function readDb(): Promise<DBData> {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8')
        return JSON.parse(data)
    } catch (e) {
        return { users: [], posts: [], comments: [] }
    }
}

export async function writeDb(data: DBData): Promise<void> {
    await ensureDir()
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// --- User Management ---
export async function upsertUser(user: { id: string, name: string, role?: string }) {
    const db = await readDb()
    const existingIndex = db.users.findIndex(u => u.id === user.id)

    if (existingIndex >= 0) {
        // Update basic info only if changed, keep reputation/badges
        db.users[existingIndex].name = user.name
        // db.users[existingIndex].role = user.role as any || db.users[existingIndex].role
    } else {
        // Create new
        db.users.push({
            id: user.id,
            name: user.name,
            role: (user.role as any) || 'user',
            reputation: 0,
            badges: [],
            certified: false
        })
    }
    await writeDb(db)
}

export async function getContributors(): Promise<User[]> {
    const db = await readDb()
    // Sort by reputation desc, take top 10
    return db.users.sort((a, b) => b.reputation - a.reputation).slice(0, 10)
}

// Helpers
export async function getPosts() {
    const db = await readDb()
    return db.posts.map(post => {
        const author = db.users.find(u => u.id === post.authorId)
        const answersCount = db.comments.filter(c => c.postId === post.id).length
        return { ...post, author, answersCount }
    })
}

export async function getPostById(id: string) {
    const db = await readDb()
    const post = db.posts.find(p => p.id === id)
    if (!post) return null

    const author = db.users.find(u => u.id === post.authorId)
    return { ...post, author }
}

export async function getCommentsByPostId(postId: string) {
    const db = await readDb()
    const comments = db.comments.filter(c => c.postId === postId)
    return comments.map(c => ({
        ...c,
        author: db.users.find(u => u.id === c.authorId)
    }))
}

export async function createPost(post: Omit<Post, 'id' | 'createdAt' | 'votes' | 'views' | 'solved'>) {
    const db = await readDb()
    const newPost: Post = {
        ...post,
        id: 'q' + Date.now(),
        votes: 0,
        views: 0,
        solved: false,
        createdAt: new Date().toISOString()
    }
    db.posts.push(newPost)

    // Award reputation to author
    const authorIdx = db.users.findIndex(u => u.id === post.authorId)
    if (authorIdx >= 0) {
        db.users[authorIdx].reputation += 10
    }

    await writeDb(db)
    return newPost
}

export async function createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'votes' | 'accepted' | 'ibmVerified'>) {
    const db = await readDb()
    const newComment: Comment = {
        ...comment,
        id: 'a' + Date.now(),
        votes: 0,
        accepted: false,
        ibmVerified: false,
        createdAt: new Date().toISOString()
    }
    db.comments.push(newComment)

    // Check IBM role
    const author = db.users.find(u => u.id === comment.authorId)
    if (author?.role === 'ibm') {
        newComment.ibmVerified = true
    }

    // Award reputation
    const authorIdx = db.users.findIndex(u => u.id === comment.authorId)
    if (authorIdx >= 0) {
        db.users[authorIdx].reputation += 5
    }

    await writeDb(db)
    return newComment
}

export async function toggleVote(type: 'post' | 'comment', id: string, increment: boolean) {
    const db = await readDb()
    let item
    if (type === 'post') {
        item = db.posts.find(p => p.id === id)
    } else {
        item = db.comments.find(c => c.id === id)
    }

    if (item) {
        item.votes += increment ? 1 : -1
        await writeDb(db)
        return item.votes
    }
    return 0
}
