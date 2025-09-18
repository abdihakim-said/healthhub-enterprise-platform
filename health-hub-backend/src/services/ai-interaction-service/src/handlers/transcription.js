const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const secretsManager = new AWS.SecretsManager();

// Get Azure Speech credentials from Secrets Manager
async function getAzureCredentials() {
  try {
    const secretName = process.env.AZURE_SECRET_NAME || 'healthhub/dev/azure-speech-credentials';
    const result = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    return JSON.parse(result.SecretString);
  } catch (error) {
    console.error('Error getting Azure credentials:', error);
    throw new Error('Failed to get Azure credentials');
  }
}

// Mock transcription function (replace with actual Azure Speech Service integration)
async function transcribeAudio(audioData, language = 'en-US') {
  // This is a mock implementation
  // In production, you would integrate with Azure Speech Service
  return {
    text: "This is a mock transcription of the audio file. In production, this would be the actual transcribed text from Azure Speech Service.",
    confidence: 0.95,
    language: language,
    duration: 30
  };
}

exports.transcribe = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { patientId, language = 'en-US', audioData } = body;

    if (!patientId || !audioData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: patientId and audioData'
        })
      };
    }

    // Get Azure credentials
    const azureCredentials = await getAzureCredentials();

    // Transcribe audio (mock implementation)
    const transcriptionResult = await transcribeAudio(audioData, language);

    // Save transcription to DynamoDB
    const transcriptionId = uuidv4();
    const timestamp = new Date().toISOString();

    const transcriptionRecord = {
      id: transcriptionId,
      patientId,
      text: transcriptionResult.text,
      confidence: transcriptionResult.confidence,
      language,
      duration: transcriptionResult.duration,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'completed'
    };

    await dynamodb.put({
      TableName: process.env.AI_INTERACTION_TABLE,
      Item: transcriptionRecord
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: transcriptionId,
        text: transcriptionResult.text,
        confidence: transcriptionResult.confidence,
        language,
        duration: transcriptionResult.duration,
        status: 'completed'
      })
    };

  } catch (error) {
    console.error('Transcription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to transcribe audio',
        message: error.message
      })
    };
  }
};

exports.list = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const result = await dynamodb.scan({
      TableName: process.env.AI_INTERACTION_TABLE,
      FilterExpression: 'attribute_exists(#text)',
      ExpressionAttributeNames: {
        '#text': 'text'
      }
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transcriptions: result.Items || []
      })
    };

  } catch (error) {
    console.error('List transcriptions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to list transcriptions',
        message: error.message
      })
    };
  }
};

exports.get = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    const { id } = event.pathParameters;

    const result = await dynamodb.get({
      TableName: process.env.AI_INTERACTION_TABLE,
      Key: { id }
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Transcription not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item)
    };

  } catch (error) {
    console.error('Get transcription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get transcription',
        message: error.message
      })
    };
  }
};
