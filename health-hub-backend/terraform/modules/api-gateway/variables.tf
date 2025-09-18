variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "waf_web_acl_arn" {
  description = "WAF Web ACL ARN for API Gateway protection"
  type        = string
  default     = null
}

variable "custom_domain" {
  description = "Custom domain for API Gateway"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = ""
}
