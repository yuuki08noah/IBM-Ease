terraform {
  required_version = ">= 1.5.0"

  cloud {
    organization = "ibm-ease"

    workspaces {
      name = "ibm-cloud-developer-studio-quickstart"
    }
  }

  required_providers {
    ibm = {
      source  = "IBM-Cloud/ibm"
      version = ">= 1.50.0"
    }
  }
}
