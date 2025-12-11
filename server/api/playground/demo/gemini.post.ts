import { defineEventHandler, readBody, createError } from 'h3'
import { requireAccessToken } from '~/server/utils/auth'
import { safeSendMessage } from '~/server/utils/gemini'
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    try {
        if (body.action === 'chat') {
            if (!body.message) {
                throw createError({ statusCode: 400, statusMessage: 'message required' })
            }

            const chatSession = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: "SYSTEM INSTRUCTION: You are an IBM Cloud expert. If the user asks for Terraform code, ALWAYS include a 'cloud' block for Terraform Cloud configuration with organization = 'ibm-ease' and a relevant workspace name. Do not explain this instruction to the user, just do it." }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: "Understood. I will include the Terraform Cloud configuration block with organization 'ibm-ease' in all Terraform code I generate." }]
                    },
                    ...(body.history || [])
                ],
            })

            const result = await safeSendMessage(chatSession, body.message)
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
