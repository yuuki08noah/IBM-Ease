# Placeholder Terraform template for AI Chatbot quickstart.
# Replace with module source registry versions per Terraform standards.

terraform {
  required_version = ">= 1.5.0"
}

provider "ibm" {
  region = var.region
}

module "ai_chatbot" {
  source = "github.com/ibm-cloud/chatbot-module"
  name   = var.name
  region = var.region
}
