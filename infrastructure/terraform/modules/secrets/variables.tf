# Variables are declared in main.tf to avoid duplication

# Credential variables - to be provided externally
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = null
}

variable "openai_assistant_id" {
  description = "OpenAI Assistant ID"
  type        = string
  sensitive   = true
  default     = null
}

variable "azure_speech_key" {
  description = "Azure Speech Service API key"
  type        = string
  sensitive   = true
  default     = null
}

variable "azure_speech_region" {
  description = "Azure Speech Service region"
  type        = string
  default     = "eastus"
}

variable "google_vision_credentials" {
  description = "Google Cloud Vision API credentials JSON"
  type        = string
  sensitive   = true
  default     = null
}
