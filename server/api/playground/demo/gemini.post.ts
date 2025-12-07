import { defineEventHandler, readBody, createError } from 'h3'
import { requireAccessToken } from '~/server/utils/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface GeminiDemoRequest {
    action: 'chat'
    message: string
    history?: { role: 'user' | 'model'; parts: { text: string }[] }[]
}

export default defineEventHandler(async (event) => {
    requireAccessToken(event)
    const body = await readBody<GeminiDemoRequest>(event)

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

    if (!apiKey) {
        throw createError({ statusCode: 500, statusMessage: 'Server configuration error: Missing API Key' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    try {
        if (body.action === 'chat') {
            if (!body.message) {
                throw createError({ statusCode: 400, statusMessage: 'message required' })
            }

            const chatSession = model.startChat({
                history: body.history || [],
            })

            const result = await chatSession.sendMessage(body.message)
            const response = await result.response
            const text = response.text()

            return {
                success: true,
                response: text,
            }
        }

        throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
    } catch (err: any) {
        return {
            success: false,
            error: err.message || 'Unknown error'
        }
    }
})
