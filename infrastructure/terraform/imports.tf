# Import existing CloudFront functions to avoid conflicts
# Import blocks must be in root module, not child modules

import {
  to = module.cloudfront[0].aws_cloudfront_function.audit_logging
  id = "healthhub-production-audit-logging"
}
