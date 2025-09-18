const AWS = require('aws-sdk');

// Initialize AWS Secrets Manager client
const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Cache for secrets to avoid repeated API calls
const secretsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get secret from AWS Secrets Manager with caching
 * @param {string} secretName - Name of the secret in Secrets Manager
 * @returns {Promise<Object>} - Parsed secret value
 */
async function getSecret(secretName) {
  // Check cache first
  const cached = secretsCache.get(secretName);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.value;
  }

  try {
    console.log(`Fetching secret: ${secretName}`);
    
    const result = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise();

    const secretValue = JSON.parse(result.SecretString);
    
    // Cache the result
    secretsCache.set(secretName, {
      value: secretValue,
      timestamp: Date.now()
    });

    console.log(`Successfully retrieved secret: ${secretName}`);
    return secretValue;
    
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    
    // Fallback to environment variables for backward compatibility
    if (secretName.includes('openai')) {
      console.log('Falling back to environment variables for OpenAI');
      return {
        api_key: process.env.OPEN_AI_KEY,
        assistant_id: process.env.ASSISTANT_ID
      };
    }
    
    if (secretName.includes('azure-speech')) {
      console.log('Falling back to environment variables for Azure Speech');
      return {
        speech_key: process.env.AZURE_SPEECH_KEY,
        speech_region: process.env.AZURE_SPEECH_REGION
      };
    }
    
    if (secretName.includes('google-vision')) {
      console.log('Falling back to environment variables for Google Vision');
      return {
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
        client_email: process.env.GOOGLE_CLIENT_EMAIL
      };
    }
    
    throw error;
  }
}

/**
 * Get OpenAI credentials
 * @returns {Promise<{api_key: string, assistant_id: string}>}
 */
async function getOpenAICredentials() {
  const secretName = process.env.OPENAI_SECRET_NAME || 'healthhub/dev/openai-credentials';
  return await getSecret(secretName);
}

/**
 * Get Azure Speech Service credentials
 * @returns {Promise<{speech_key: string, speech_region: string}>}
 */
async function getAzureSpeechCredentials() {
  const secretName = process.env.AZURE_SECRET_NAME || 'healthhub/dev/azure-speech-credentials';
  return await getSecret(secretName);
}

/**
 * Get Google Vision API credentials
 * @returns {Promise<Object>}
 */
async function getGoogleVisionCredentials() {
  const secretName = process.env.GOOGLE_SECRET_NAME || 'healthhub/dev/google-vision-credentials';
  return await getSecret(secretName);
}

/**
 * Clear secrets cache (useful for testing or forced refresh)
 */
function clearSecretsCache() {
  secretsCache.clear();
  console.log('Secrets cache cleared');
}

module.exports = {
  getSecret,
  getOpenAICredentials,
  getAzureSpeechCredentials,
  getGoogleVisionCredentials,
  clearSecretsCache
};
