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

  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDocumentClient)
    },
    config: {
      update: jest.fn()
    }
  };
});
