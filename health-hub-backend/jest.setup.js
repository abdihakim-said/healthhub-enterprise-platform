// Jest setup file to configure AWS for tests
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

// Set test environment variables
process.env.AI_INTERACTION_TABLE = 'test-ai-interactions-table';
process.env.S3_BUCKET = 'test-s3-bucket';
process.env.OPENAI_SECRET_NAME = 'test/openai-credentials';
process.env.AZURE_SECRET_NAME = 'test/azure-credentials';
process.env.OPEN_AI_KEY = 'test-openai-key';
process.env.ASSISTANT_ID = 'test-assistant-id';

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
          api_key: 'test-openai-key',
          assistant_id: 'test-assistant-id',
          AZURE_SPEECH_KEY: 'test-azure-key',
          AZURE_SPEECH_REGION: 'eastus'
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
    }),
    putObject: jest.fn().mockReturnValue({
      promise: () => Promise.resolve({})
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://mock-signed-url.com/file.mp3')
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

// Mock fetch for OpenAI API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{
        message: {
          content: 'Mock AI response for testing'
        }
      }]
    })
  })
);
