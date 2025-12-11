variable "ibmcloud_api_key" {
  description = "The IBM Cloud API key to use for provisioning resources."
  type        = string
  sensitive   = true
}

variable "region" {
  description = "The IBM Cloud region where resources will be provisioned."
  type        = string
  default     = "us-south"
}

variable "name" {
  description = "The name of the chatbot project."
  type        = string
  default     = "my-ai-chatbot"
}
