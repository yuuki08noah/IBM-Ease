
/**
 * Safe wrapper for Gemini ChatSession.sendMessage with retry logic for 503 errors.
 * 
 * @param chatSession The chat session instance
 * @param message The message to send
 * @param retries Number of retries (default: 3)
 * @param delay Initial delay in ms (default: 1000)
 * @returns The result from sendMessage
 */
export async function safeSendMessage(chatSession: any, message: string, retries = 3, delay = 1000): Promise<any> {
    try {
        return await chatSession.sendMessage(message)
    } catch (err: any) {
        // Check for 503 or "overloaded" in error message
        const isOverloaded = err.response?.status === 503 ||
            err.message?.includes('503') ||
            err.message?.toLowerCase().includes('overloaded')

        if (isOverloaded && retries > 0) {
            console.warn(`Gemini API overloaded (503). Retrying in ${delay}ms... (${retries} retries left)`)
            await new Promise(resolve => setTimeout(resolve, delay))
            // Exponential backoff
            return safeSendMessage(chatSession, message, retries - 1, delay * 2)
        }

        throw err
    }
}
