variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "rate_limit" {
  description = "Rate limit per 5 minutes"
  type        = number
  default     = 2000
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}
