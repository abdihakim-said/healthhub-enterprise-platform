output "openai_secret_arn" {
  description = "ARN of OpenAI credentials secret"
  value       = aws_secretsmanager_secret.openai_credentials.arn
}

output "openai_secret_name" {
  description = "Name of OpenAI credentials secret"
  value       = aws_secretsmanager_secret.openai_credentials.name
}

output "azure_speech_secret_arn" {
  description = "ARN of Azure Speech Service credentials secret"
  value       = aws_secretsmanager_secret.azure_speech_credentials.arn
}

output "azure_speech_secret_name" {
  description = "Name of Azure Speech Service credentials secret"
  value       = aws_secretsmanager_secret.azure_speech_credentials.name
}

output "google_vision_secret_arn" {
  description = "ARN of Google Vision API credentials secret"
  value       = aws_secretsmanager_secret.google_vision_credentials.arn
}

output "google_vision_secret_name" {
  description = "Name of Google Vision API credentials secret"
  value       = aws_secretsmanager_secret.google_vision_credentials.name
}

output "secrets_policy_arn" {
  description = "ARN of IAM policy for secrets access"
  value       = aws_iam_policy.secrets_access.arn
}

output "secrets_setup_commands" {
  description = "Commands to populate secrets with actual values"
  value = {
    openai = "aws secretsmanager put-secret-value --secret-id ${aws_secretsmanager_secret.openai_credentials.name} --secret-string '{\"api_key\":\"YOUR_OPENAI_KEY\",\"assistant_id\":\"YOUR_ASSISTANT_ID\"}'"
    azure  = "aws secretsmanager put-secret-value --secret-id ${aws_secretsmanager_secret.azure_speech_credentials.name} --secret-string '{\"speech_key\":\"YOUR_AZURE_KEY\",\"speech_region\":\"centralus\"}'"
    google = "aws secretsmanager put-secret-value --secret-id ${aws_secretsmanager_secret.google_vision_credentials.name} --secret-string file://google-credentials.json"
  }
}
