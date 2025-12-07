import { defineEventHandler, getRouterParam } from 'h3'
import { labs } from './index.get'

export default defineEventHandler((event) => {
  const labId = getRouterParam(event, 'labId')
  const lab = labs.find(l => l.id === labId)

  if (!lab) {
    throw createError({ statusCode: 404, statusMessage: 'Lab not found' })
  }

  return lab
})
