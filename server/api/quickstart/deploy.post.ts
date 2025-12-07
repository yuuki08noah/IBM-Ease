import { defineEventHandler, readBody, createError } from 'h3'
import { quickstartTemplates } from '../../utils/templates'
import { buildTerraformBundle } from '../../utils/terraform'
import { validateParams } from '../../utils/validation'
import { saveBundle } from '../../utils/bundles'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ templateId: string; params: { name: string; region: string; resourceGroup: string; env: string } }>(event)
  if (!body?.templateId) {
    throw createError({ statusCode: 400, statusMessage: 'templateId required' })
  }
  const template = quickstartTemplates.find((t) => t.id === body.templateId)
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'template not found' })
  }

  const errors = validateParams(body.params)
  if (errors.length) {
    throw createError({ statusCode: 400, statusMessage: errors.join('; ') })
  }

  const config = useRuntimeConfig()
  if (!config.terraform.backendBucket || !config.terraform.backendRegion) {
    throw createError({ statusCode: 500, statusMessage: 'Terraform backend config missing (TF_BACKEND_BUCKET/TF_BACKEND_REGION)' })
  }

  const bundle = await buildTerraformBundle(template, {
    name: body.params.name,
    region: body.params.region,
    resourceGroup: body.params.resourceGroup,
    env: body.params.env,
    backendBucket: config.terraform.backendBucket as string,
    backendRegion: config.terraform.backendRegion as string,
    backendEndpoint: process.env.TF_BACKEND_ENDPOINT,
    registry: config.terraform.registry as string
  })

  const stored = saveBundle(bundle.filename, 'application/zip', bundle.zipBuffer)

  return {
    plan: bundle.main,
    downloadUrl: stored.path,
    readme: bundle.readme
  }
})
