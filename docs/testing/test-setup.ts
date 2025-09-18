import { config } from 'aws-sdk';

// Configure AWS SDK for LocalStack
config.update({
  accessKeyId: 'test',
  secretAccessKey: 'test',
  region: 'us-east-1',
});

// Set environment variables for testing
process.env.AWS_REGION = 'us-east-1';
process.env.LOCALSTACK_ENDPOINT = 'http://localhost:4566';
process.env.NODE_ENV = 'test';

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
