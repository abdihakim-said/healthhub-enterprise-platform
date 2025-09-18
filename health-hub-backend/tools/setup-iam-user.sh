#!/bin/bash

# Set variables
USER_NAME="serverless-deployer"
POLICY_NAME="ServerlessDeploymentPolicy"

echo "Creating IAM user for serverless deployments..."

# Create IAM user
aws iam create-user --user-name $USER_NAME

# Create access key
aws iam create-access-key --user-name $USER_NAME

# Create custom policy
aws iam create-policy --policy-name $POLICY_NAME --policy-document file://serverless-deployment-policy.json

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach custom policy to user
aws iam attach-user-policy --user-name $USER_NAME --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME

echo "IAM user $USER_NAME created with serverless deployment permissions"
echo "Use the access key credentials shown above to configure AWS CLI"
