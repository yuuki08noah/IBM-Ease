import { defineEventHandler, getRouterParam, readBody, setCookie } from 'h3'
import { requireUser } from '~/server/utils/auth'

interface ProgressUpdate {
  completedSteps: number[]
  currentStep: number
}

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const labId = getRouterParam(event, 'labId')
  const body = await readBody<ProgressUpdate>(event)

  if (!body.completedSteps || typeof body.currentStep !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid progress data' })
  }

  const progressKey = `lab_progress_${user.id}_${labId}`

  setCookie(event, progressKey, JSON.stringify(body), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  return {
    success: true,
    completedSteps: body.completedSteps,
    currentStep: body.currentStep
  }
})
