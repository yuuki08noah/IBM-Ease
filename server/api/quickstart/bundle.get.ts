import { defineEventHandler, getQuery, createError, setHeader, send } from 'h3'
import { getBundle } from '../../utils/bundles'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const id = query.id as string | undefined
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  const bundle = getBundle(id)
  if (!bundle) {
    throw createError({ statusCode: 404, statusMessage: 'bundle not found or expired' })
  }
  setHeader(event, 'Content-Type', bundle.mime)
  setHeader(event, 'Content-Disposition', `attachment; filename="${bundle.filename}"`)
  return send(event, bundle.buffer)
})
