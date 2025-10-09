#!/usr/bin/env node

const axios = require('axios');

const ENDPOINTS = {
  staging: {
    frontend: 'https://d1aylx7zsl7bap.cloudfront.net',
    api: 'https://eqd8yoyih2.execute-api.us-east-1.amazonaws.com'
  },
  production: {
    frontend: 'https://d1aylx7zsl7bap.cloudfront.net',
    api: 'https://eqd8yoyih2.execute-api.us-east-1.amazonaws.com'
  }
};

async function runSmokeTests(environment) {
  console.log(`🧪 Running smoke tests for ${environment}...`);
  
  const endpoints = ENDPOINTS[environment];
  let passed = 0;
  let failed = 0;

  // Test 1: Frontend Health
  try {
    const response = await axios.get(endpoints.frontend, { timeout: 10000 });
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      passed++;
    } else {
      console.log(`❌ Frontend returned status: ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Frontend test failed: ${error.message}`);
    failed++;
  }

  // Test 2: API Health Check
  try {
    const response = await axios.get(`${endpoints.api}/health`, { timeout: 10000 });
    if (response.status === 200) {
      console.log('✅ API health check passed');
      passed++;
    } else {
      console.log(`❌ API health check failed: ${response.status}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ API health check failed: ${error.message}`);
    failed++;
  }

  // Results
  console.log(`\n📊 Smoke Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log(`\n💥 Smoke tests failed! Deployment should be rolled back.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All smoke tests passed! Deployment is healthy.`);
    process.exit(0);
  }
}

const environment = process.argv[2] || 'staging';
runSmokeTests(environment);
