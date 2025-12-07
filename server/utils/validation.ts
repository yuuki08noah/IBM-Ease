const allowedRegions = ['us-south', 'us-east', 'eu-de', 'eu-gb', 'jp-osa', 'jp-tok']

export type QuickstartParams = {
  name: string
  region: string
  resourceGroup: string
  env: string
}

export function validateParams(params: QuickstartParams): string[] {
  const errors: string[] = []
  if (!params.name || !/^[a-z0-9-]{3,40}$/.test(params.name)) {
    errors.push('name must be 3-40 chars, lowercase, numbers or hyphens')
  }
  if (!params.region || !allowedRegions.includes(params.region)) {
    errors.push(`region must be one of: ${allowedRegions.join(', ')}`)
  }
  if (!params.resourceGroup || params.resourceGroup.length < 2) {
    errors.push('resourceGroup is required')
  }
  if (!params.env || !/^[a-z0-9-]{2,12}$/.test(params.env)) {
    errors.push('env must be 2-12 chars, lowercase/number/hyphen')
  }
  return errors
}
