# Placeholder Terraform template for AI Chatbot quickstart.
# Replace with module source registry versions per Terraform standards.



provider "ibm" {
  region           = var.region
  ibmcloud_api_key = var.ibmcloud_api_key
}

module "ai_chatbot" {
  source = "github.com/ibm-cloud/chatbot-module"
  name   = var.name
  region = var.region
}
