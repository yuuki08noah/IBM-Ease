import { defineEventHandler, readBody } from 'h3'
import { requireAccessToken } from '~/server/utils/auth'

interface CloudantDemoRequest {
  action: 'list_dbs' | 'create_doc' | 'get_doc' | 'find_docs'
  db?: string
  docId?: string
  doc?: Record<string, any>
  selector?: Record<string, any>
}

export default defineEventHandler(async (event) => {
  const token = requireAccessToken(event)
  const body = await readBody<CloudantDemoRequest>(event)

  const cloudantUrl = process.env.CLOUDANT_URL || 'https://your-cloudant-instance.cloudantnosqldb.appdomain.cloud'

  try {
    if (body.action === 'list_dbs') {
      const response = await fetch(`${cloudantUrl}/_all_dbs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Cloudant API error: ${response.statusText}`)
      }

      const dbs = await response.json()
      return {
        success: true,
        databases: dbs
      }
    }

    if (body.action === 'create_doc') {
      if (!body.db || !body.doc) {
        throw createError({ statusCode: 400, statusMessage: 'db and doc required' })
      }

      const response = await fetch(`${cloudantUrl}/${body.db}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body.doc)
      })

      if (!response.ok) {
        throw new Error(`Cloudant API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        id: data.id,
        rev: data.rev
      }
    }

    if (body.action === 'get_doc') {
      if (!body.db || !body.docId) {
        throw createError({ statusCode: 400, statusMessage: 'db and docId required' })
      }

      const response = await fetch(`${cloudantUrl}/${body.db}/${body.docId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Cloudant API error: ${response.statusText}`)
      }

      const doc = await response.json()
      return {
        success: true,
        document: doc
      }
    }

    if (body.action === 'find_docs') {
      if (!body.db || !body.selector) {
        throw createError({ statusCode: 400, statusMessage: 'db and selector required' })
      }

      const response = await fetch(`${cloudantUrl}/${body.db}/_find`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selector: body.selector,
          limit: 10
        })
      })

      if (!response.ok) {
        throw new Error(`Cloudant API error: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        docs: data.docs,
        bookmark: data.bookmark
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
