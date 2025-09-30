// Jest setup file to configure AWS for tests
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

// Mock AWS SDK to prevent real AWS calls in unit tests
jest.mock('aws-sdk', () => {
  const mockDocumentClient = {
    put: jest.fn().mockReturnValue({ promise: () => Promise.resolve({}) }),
    get: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Item: {} }) }),
    scan: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) }),
    query: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) }),
    update: jest.fn().mockReturnValue({ promise: () => Promise.resolve({}) }),
    delete: jest.fn().mockReturnValue({ promise: () => Promise.resolve({}) })
  };

  const mockDynamoDB = jest.fn(() => ({
    putItem: jest.fn().mockReturnValue({ promise: () => Promise.resolve({}) }),
    getItem: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Item: {} }) }),
    scan: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) }),
    query: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Items: [] }) })
  }));

  const mockSecretsManager = jest.fn(() => ({
    getSecretValue: jest.fn().mockReturnValue({ 
      promise: () => Promise.resolve({ 
        SecretString: JSON.stringify({ 
          OPENAI_API_KEY: 'test-key',
          AZURE_SPEECH_KEY: 'test-key' 
        }) 
      }) 
    })
  }));

  // Add DocumentClient as a property of DynamoDB
  mockDynamoDB.DocumentClient = jest.fn(() => mockDocumentClient);

  return {
    DynamoDB: mockDynamoDB,
    SecretsManager: mockSecretsManager,
    config: {
      update: jest.fn()
    }
  };
});
