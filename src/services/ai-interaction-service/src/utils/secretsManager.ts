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
    if (secretName.includes('openai')) {
      console.log('Falling back to environment variables for OpenAI');
      return {
        api_key: process.env.OPEN_AI_KEY,
        assistant_id: process.env.ASSISTANT_ID
      };
    }
    
    throw error;
  }
}

/**
 * Get OpenAI credentials
 */
export async function getOpenAICredentials(): Promise<{api_key: string; assistant_id: string}> {
  const secretName = process.env.OPENAI_SECRET_NAME || 'healthhub/dev/openai-credentials';
  return await getSecret(secretName);
}

/**
 * Clear secrets cache (useful for testing or forced refresh)
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
  console.log('Secrets cache cleared');
}
