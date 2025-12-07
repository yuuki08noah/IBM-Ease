import { defineEventHandler, getRouterParam, getCookie } from 'h3'
import { getUser } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  const user = getUser(event)
  if (!user) {
    return { completedSteps: [], currentStep: 1 }
  }

  const labId = getRouterParam(event, 'labId')
  const progressKey = `lab_progress_${user.id}_${labId}`
  const progressCookie = getCookie(event, progressKey)

  if (!progressCookie) {
    return { completedSteps: [], currentStep: 1 }
  }

  try {
    return JSON.parse(progressCookie)
  } catch {
    return { completedSteps: [], currentStep: 1 }
  }
})
