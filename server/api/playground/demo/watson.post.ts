import { defineEventHandler, readBody, createError } from 'h3'
import { requireAccessToken } from '~/server/utils/auth'

interface WatsonDemoRequest {
    action: 'create_session' | 'send_message' | 'list_assistants'
    assistantId?: string
    sessionId?: string
    message?: string
}

export default defineEventHandler(async (event) => {
    const token = requireAccessToken(event)
    const body = await readBody<WatsonDemoRequest>(event)

    const watsonUrl = process.env.WATSON_API_URL || 'https://api.us-south.assistant.watson.cloud.ibm.com'
    const version = '2023-06-15'

    try {
        if (body.action === 'list_assistants') {
            const response = await fetch(`${watsonUrl}/v2/assistants?version=${version}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`Watson API error: ${response.statusText}`)
            }

            const data = await response.json()
            return {
                success: true,
                assistants: data.assistants || []
            }
        }

        if (body.action === 'create_session') {
            if (!body.assistantId) {
                throw createError({ statusCode: 400, statusMessage: 'assistantId required' })
            }

            const response = await fetch(`${watsonUrl}/v2/assistants/${body.assistantId}/sessions?version=${version}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`Watson API error: ${response.statusText}`)
            }

            const data = await response.json()
            return {
                success: true,
                sessionId: data.session_id
            }
        }

        if (body.action === 'send_message') {
            const assistantId = body.assistantId || process.env.WATSON_ASSISTANT_ID

            if (!assistantId || !body.message) {
                throw createError({ statusCode: 400, statusMessage: 'assistantId (or env WATSON_ASSISTANT_ID) and message required' })
            }

            let sessionId = body.sessionId

            // Auto-create session if not provided
            if (!sessionId) {
                const sessionRes = await fetch(`${watsonUrl}/v2/assistants/${assistantId}/sessions?version=${version}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!sessionRes.ok) {
                    throw new Error(`Failed to create session: ${sessionRes.statusText}`)
                }
                const sessionData = await sessionRes.json()
                sessionId = sessionData.session_id
            }

            const response = await fetch(
                `${watsonUrl}/v2/assistants/${assistantId}/sessions/${sessionId}/message?version=${version}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        input: {
                            message_type: 'text',
                            text: body.message
                        }
                    })
                }
            )

            if (!response.ok) {
                throw new Error(`Watson API error: ${response.statusText}`)
            }

            const data = await response.json()
            return {
                success: true,
                response: data.output?.generic?.[0]?.text || 'No response',
                sessionId: sessionId, // Return session ID so client can reuse it
                fullResponse: data
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
