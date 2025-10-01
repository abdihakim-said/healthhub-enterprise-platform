# Import existing CloudFront functions to avoid conflicts

import {
  to = aws_cloudfront_function.audit_logging
  id = "healthhub-production-audit-logging"
}
