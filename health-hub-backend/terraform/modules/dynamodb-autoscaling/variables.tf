variable "table_names" {
  description = "Set of DynamoDB table names"
  type        = set(string)
}

variable "min_read_capacity" {
  description = "Minimum read capacity"
  type        = number
  default     = 5
}

variable "max_read_capacity" {
  description = "Maximum read capacity"
  type        = number
  default     = 100
}

variable "min_write_capacity" {
  description = "Minimum write capacity"
  type        = number
  default     = 5
}

variable "max_write_capacity" {
  description = "Maximum write capacity"
  type        = number
  default     = 100
}

variable "target_utilization" {
  description = "Target utilization percentage"
  type        = number
  default     = 70
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "enable_backup" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}
