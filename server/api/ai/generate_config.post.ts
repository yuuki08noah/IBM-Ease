import { defineEventHandler, readBody } from 'h3'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { safeSendMessage } from '~/server/utils/gemini'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

    if (!apiKey) {
        throw createError({ statusCode: 500, statusMessage: 'Gemini API Key not configured' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

    const systemPrompt = `You are an IBM Cloud Solutions Architect. The user wants to build a cloud application. 
  Your goal is to configure the "Quick Start" form for them.
  
  Available Templates:
  1. "ai-chatbot": AI Chatbot + Cloudant (params: region, resourceGroup)
  2. "iot-backend": IoT Ingestion Backend (params: region, resourceGroup)
  3. "react-cloudant": React + Cloudant Fullstack (params: region, resourceGroup)
  
  Available Regions: us-south, us-east, eu-de, eu-gb, jp-tok
  
  Output ONLY valid JSON in the following format:
  {
      "message": "A brief explanation of what you configured.",
      "structuredData": {
          "template": "string (one of IDs above)",
          "region": "string (default us-south)",
          "appName": "string (generated from context)",
          "resourceGroup": "string (default Default)",
          "tags": "string (comma separated)"
      }
  }
  
  Do not include markdown formatting like \`\`\`json. Just the raw JSON.
  `

    try {
        const chatSession = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Understood. I will output strictly JSON configuration based on user requests." }]
                },
                ...(body.history || [])
            ]
        })

        // Append a reminder to force JSON
        const result = await safeSendMessage(chatSession, body.message + " (Remember: Return JSON with structuredData)")
        const response = await result.response
        let text = response.text()

        // Clean up potential markdown code blocks
        text = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const json = JSON.parse(text)
            return {
                response: json.message, // The text to show in chat
                structuredData: json.structuredData // The data to update the UI
            }
        } catch (e) {
            // Fallback if AI fails to generate JSON
            return {
                response: text,
            }
        }
    } catch (err: any) {
        console.error('Gemini API Error:', err)
        throw createError({
            statusCode: 503,
            statusMessage: 'AI Service Unavailable: ' + (err.message || 'Unknown error')
        })
    }
})
