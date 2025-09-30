// Jest setup file to configure AWS for tests
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

// Mock AWS SDK to prevent real AWS calls in unit tests
jest.mock('aws-sdk', () => {
  const mockPromise = () => Promise.resolve({});
  const mockPromiseWithItem = () => Promise.resolve({ Item: {} });
  const mockPromiseWithItems = () => Promise.resolve({ Items: [] });

  const mockDocumentClient = {
    put: jest.fn().mockReturnValue({ promise: mockPromise }),
    get: jest.fn().mockReturnValue({ promise: mockPromiseWithItem }),
    scan: jest.fn().mockReturnValue({ promise: mockPromiseWithItems }),
    query: jest.fn().mockReturnValue({ promise: mockPromiseWithItems }),
    update: jest.fn().mockReturnValue({ promise: mockPromise }),
    delete: jest.fn().mockReturnValue({ promise: mockPromise }),
    batchGet: jest.fn().mockReturnValue({ promise: mockPromiseWithItems }),
    batchWrite: jest.fn().mockReturnValue({ promise: mockPromise })
  };

  // Complete DynamoDB mock for Dynamoose
  const mockDynamoDB = jest.fn(() => ({
    putItem: jest.fn().mockReturnValue({ promise: mockPromise }),
    getItem: jest.fn().mockReturnValue({ promise: mockPromiseWithItem }),
    scan: jest.fn().mockReturnValue({ promise: mockPromiseWithItems }),
    query: jest.fn().mockReturnValue({ promise: mockPromiseWithItems }),
    updateItem: jest.fn().mockReturnValue({ promise: mockPromise }),
    deleteItem: jest.fn().mockReturnValue({ promise: mockPromise }),
    batchGetItem: jest.fn().mockReturnValue({ promise: mockPromiseWithItems }),
    batchWriteItem: jest.fn().mockReturnValue({ promise: mockPromise }),
    createTable: jest.fn().mockReturnValue({ promise: mockPromise }),
    describeTable: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ Table: { TableStatus: 'ACTIVE' } }) }),
    listTables: jest.fn().mockReturnValue({ promise: () => Promise.resolve({ TableNames: [] }) })
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

  // Mock Polly, Translate, S3 for AI interaction service
  const mockPolly = jest.fn(() => ({
    synthesizeSpeech: jest.fn().mockReturnValue({
      promise: () => Promise.resolve({
        AudioStream: Buffer.from('mock-audio-data')
      })
    })
  }));

  const mockTranslate = jest.fn(() => ({
    translateText: jest.fn().mockReturnValue({
      promise: () => Promise.resolve({
        TranslatedText: 'Mock translated text'
      })
    })
  }));

  const mockS3 = jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: () => Promise.resolve({
        Location: 'https://mock-s3-url.com/file.mp3'
      })
    })
  }));

  // Add DocumentClient as a property of DynamoDB
  mockDynamoDB.DocumentClient = jest.fn(() => mockDocumentClient);

  return {
    DynamoDB: mockDynamoDB,
    SecretsManager: mockSecretsManager,
    Polly: mockPolly,
    Translate: mockTranslate,
    S3: mockS3,
    config: {
      update: jest.fn()
    }
  };
});
