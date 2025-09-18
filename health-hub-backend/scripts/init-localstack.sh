#!/bin/bash

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to start..."
while ! curl -s http://localhost:4566/health > /dev/null; do
  sleep 2
done

echo "LocalStack is ready!"

# Create DynamoDB tables
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name AIInteractions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Patients \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Doctors \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Appointments \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name Transcriptions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name MedicalImages \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Create S3 buckets
aws --endpoint-url=http://localhost:4566 s3 mb s3://healthhub-medical-images
aws --endpoint-url=http://localhost:4566 s3 mb s3://healthhub-audio-files

# Create secrets
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name healthhub/openai \
  --secret-string '{"apiKey":"test-openai-key"}'

aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name healthhub/azure \
  --secret-string '{"speechKey":"test-azure-key","speechRegion":"eastus"}'

aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
  --name healthhub/google \
  --secret-string '{"visionApiKey":"test-google-key"}'

echo "LocalStack initialization complete!"
