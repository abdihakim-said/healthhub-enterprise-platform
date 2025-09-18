#!/bin/bash

# HealthHub Project Organization Script
echo "🏥 Organizing HealthHub Project Structure..."

# Create new directory structure
mkdir -p docs/{fixes,linkedin,testing,guides}

# Move root level files to appropriate locations
echo "📁 Moving root level files..."
mv GOOGLE_VISION_FIX.md docs/fixes/ 2>/dev/null
mv SHOWCASE_ENHANCEMENTS.md docs/fixes/ 2>/dev/null
mv SYSTEM_STATUS_REPORT.md docs/fixes/ 2>/dev/null
mv QUICK_WINS.md docs/fixes/ 2>/dev/null
mv test-google-vision.* scripts/ 2>/dev/null
mv deploy-autoscaling.sh scripts/ 2>/dev/null

# Move backend documentation
echo "📚 Moving backend documentation..."
cd health-hub-backend
mv linkedin-*.md ../docs/linkedin/ 2>/dev/null
mv test-*.js ../docs/testing/ 2>/dev/null
mv test-setup.ts ../docs/testing/ 2>/dev/null
mv ARCHITECTURE.md ../docs/guides/ 2>/dev/null
mv DEPLOYMENT_GUIDE.md ../docs/guides/ 2>/dev/null
mv TESTING.md ../docs/guides/ 2>/dev/null
mv DEVOPS_ENHANCEMENTS.md ../docs/guides/ 2>/dev/null
mv ALL_SERVICES_ENHANCED.md ../docs/guides/ 2>/dev/null
mv GITHUB_PUBLICATION_GUIDE.md ../docs/guides/ 2>/dev/null

# Clean up system files
echo "🧹 Cleaning up system files..."
find . -name ".DS_Store" -delete 2>/dev/null

cd ..
echo "✅ Project organization complete!"
echo "📊 Your project is now better organized for interview presentation."
