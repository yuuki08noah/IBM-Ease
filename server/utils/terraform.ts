import JSZip from 'jszip'
import type { QuickstartTemplate } from './templates'

export type TerraformBundleParams = {
  name: string
  region: string
  resourceGroup: string
  env: string
  backendType: 'local' | 'remote' | 'tfc'
  backendBucket?: string
  backendRegion?: string
  backendEndpoint?: string
  registry?: string
  tfcOrganization?: string
}

export type TerraformBundle = {
  main: string
  readme: string
  filename: string
  zipBuffer: Buffer
}

const providerVersion = '>= 1.58.0'
const requiredVersion = '>= 1.5.0'

export async function buildTerraformBundle(template: QuickstartTemplate, params: TerraformBundleParams): Promise<TerraformBundle> {
  const moduleSource = deriveModuleSource(params.registry, template.moduleSource)

  let backendBlock = ''
  if (params.backendType === 'remote' && params.backendBucket && params.backendRegion) {
    backendBlock = `terraform {
  required_version = "${requiredVersion}"
  required_providers {
    ibm = {
      source  = "IBM-Cloud/ibm"
      version = "${providerVersion}"
    }
  }
  backend "s3" {
    bucket = "${params.backendBucket}"
    key    = "${params.env}/${params.name}.tfstate"
    region = "${params.backendRegion}"
    endpoint = "${params.backendEndpoint ?? ""}"
    skip_credentials_validation = true
    skip_region_validation      = true
  }
}
`
  } else if (params.backendType === 'tfc' && params.tfcOrganization) {
    backendBlock = `terraform {
  required_version = "${requiredVersion}"
  required_providers {
    ibm = {
      source  = "IBM-Cloud/ibm"
      version = "${providerVersion}"
    }
  }
  cloud {
    organization = "${params.tfcOrganization}"
    workspaces {
      name = "${params.name}-${params.env}"
    }
  }
}
`
  } else {
    backendBlock = `terraform {
  required_version = "${requiredVersion}"
  required_providers {
    ibm = {
      source  = "IBM-Cloud/ibm"
      version = "${providerVersion}"
    }
  }
}
`
  }

  const providerBlock = `provider "ibm" {
  region = var.region
}
`

  const moduleBlock = `module "${template.id}" {
  source         = "${moduleSource}"
  name           = "${params.name}"
  resource_group = var.resource_group
  region         = var.region
}
`

  const variablesBlock = `variable "region" {
  type    = string
  default = "${params.region}"
}

variable "resource_group" {
  type    = string
  default = "${params.resourceGroup}"
}
`

  const outputsBlock = `output "resource_group" {
  value = var.resource_group
}
`

  const main = `${backendBlock}
${providerBlock}
${moduleBlock}
${variablesBlock}
${outputsBlock}`

  const readme = `# Terraform Bundle for ${template.name}

## Contents
- main.tf: backend, provider, and module wiring for ${template.name}
- variables: region/resource_group defaults populated from request

## How to use
1) Export IBM Cloud credentials (IAM API key) in your environment.
2) Run:
   terraform init -upgrade
   terraform plan -out plan.tfplan
   terraform apply plan.tfplan

## Notes
- Backend: COS/S3-compatible with locking recommended.
- Provider: IBM Cloud >= ${providerVersion}
- Terraform: ${requiredVersion}
- Module source: ${template.moduleSource} (replace with approved registry path if needed)
`

  const zip = new JSZip()
  zip.file('main.tf', main)
  zip.file('README.md', readme)

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } })

  return {
    main,
    readme,
    filename: `${params.name}-${template.id}.zip`,
    zipBuffer
  }
}

function deriveModuleSource(registry: string | undefined, moduleSource: string): string {
  if (moduleSource.startsWith('git::')) return moduleSource
  if (moduleSource.startsWith('github.com')) return `git::https://${moduleSource}`
  if (moduleSource.startsWith('registry.terraform.io')) return moduleSource
  if (registry) return `${registry}/${moduleSource}`
  return moduleSource
}
