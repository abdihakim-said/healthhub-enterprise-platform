import { SecretsManager } from 'aws-sdk';

// Initialize AWS Secrets Manager client
const secretsManager = new SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Cache for secrets to avoid repeated API calls
const secretsCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get secret from AWS Secrets Manager with caching
 */
async function getSecret(secretName: string): Promise<any> {
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

    const secretValue = JSON.parse(result.SecretString || '{}');
    
    // Cache the result
    secretsCache.set(secretName, {
      value: secretValue,
      timestamp: Date.now()
    });

    console.log(`Successfully retrieved secret: ${secretName}`);
    return secretValue;
    
  } catch (error: any) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    
    // Fallback to environment variables for backward compatibility
    if (secretName.includes('azure-speech')) {
      console.log('Falling back to environment variables for Azure Speech');
      return {
        speech_key: process.env.AZURE_SPEECH_KEY,
        speech_region: process.env.AZURE_SPEECH_REGION
      };
    }
    
    throw error;
  }
}

/**
 * Get Azure Speech Service credentials
 */
export async function getAzureSpeechCredentials(): Promise<{speech_key: string; speech_region: string}> {
  const secretName = process.env.AZURE_SECRET_NAME || 'healthhub/production/azure-speech-credentials';
  return await getSecret(secretName);
}

/**
 * Clear secrets cache (useful for testing or forced refresh)
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
  console.log('Secrets cache cleared');
}
