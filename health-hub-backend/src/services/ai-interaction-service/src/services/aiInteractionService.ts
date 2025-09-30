import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { OpenAI } from "openai";
import { getOpenAICredentials } from "../utils/secretsManager";

class AIInteraction extends Document {
  id: string;
  userId: string;
  interactionType: "virtualAssistant" | "speechConversion" | "imageAnalysis";
  content: string;
  audioUrl?: string;
  response?: string;
  createdAt: Date;
}

const AIInteractionSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
  },
  userId: {
    type: String,
    index: {
      global: true,
      name: "UserIdIndex",
      rangeKey: "interactionType",
    },
  },
  interactionType: {
    type: String,
    enum: ["virtualAssistant", "speechConversion", "imageAnalysis"],
  },
  content: String,
  audioUrl: {
    type: String,
    required: false,
  },
  response: {
    type: String,
    required: false,
  },
  createdAt: Date,
});

const AIInteractionModel = dynamoose.model<AIInteraction>(
  process.env.AI_INTERACTION_TABLE!,
  AIInteractionSchema,
  {
    create: false,
  }
);

export class AIInteractionService {
  private polly: Polly;
  private translate: Translate;
  private s3: S3;
  private openai: OpenAI | null = null;
  private openaiCredentials: { api_key: string; assistant_id: string } | null = null;

  constructor() {
    this.polly = new AWS.Polly();
    this.translate = new AWS.Translate({ region: "us-east-1" });
    this.s3 = new AWS.S3();
  }

  /**
   * Initialize OpenAI credentials from Secrets Manager
   */
  private async initializeOpenAI(): Promise<void> {
    if (this.openaiCredentials && this.openai) {
      return; // Already initialized
    }

    try {
      console.log('Initializing OpenAI with Secrets Manager credentials...');
      this.openaiCredentials = await getOpenAICredentials();
      this.openai = new OpenAI({
        apiKey: this.openaiCredentials.api_key,
      });
      console.log('✅ OpenAI credentials loaded successfully from Secrets Manager');
    } catch (error: any) {
      console.error('❌ Failed to load OpenAI credentials from Secrets Manager:', error?.message || error);
      console.log('🔄 Falling back to environment variables...');
      
      // Fallback to environment variables
      if (process.env.OPEN_AI_KEY) {
        this.openaiCredentials = {
          api_key: process.env.OPEN_AI_KEY,
          assistant_id: process.env.ASSISTANT_ID || ''
        };
        this.openai = new OpenAI({
          apiKey: this.openaiCredentials.api_key,
        });
        console.log('✅ OpenAI credentials loaded from environment variables');
      } else {
        throw new Error('OpenAI credentials not available in Secrets Manager or environment variables');
      }
    }
  }

  async create(data: Partial<AIInteraction>): Promise<AIInteraction> {
    try {
      const newInteraction = new AIInteractionModel({
        ...data,
        id: uuidv4(),
        createdAt: new Date(),
      });

      // If this is a virtual assistant request, process it with OpenAI
      if (data.interactionType === 'virtualAssistant' && data.content) {
        console.log('Processing virtual assistant request with OpenAI...');
        try {
          const aiResponse = await this.processVirtualAssistant(data.content, data.userId || '');
          newInteraction.response = aiResponse;
          console.log('✅ OpenAI response generated and saved');
        } catch (aiError) {
          console.error('❌ OpenAI processing failed:', aiError);
          newInteraction.response = `I'm your HealthHub AI assistant. I apologize, but I'm currently experiencing technical difficulties. Please try again later or contact support if the issue persists.`;
        }
      }

      await newInteraction.save();
      console.log('INFO', 'AI interaction created successfully');
      return newInteraction;
    } catch (error) {
      console.error('ERROR', 'Failed to create AI interaction:', error);
      throw error;
    }
  }

  async get(id: string): Promise<AIInteraction | null> {
    try {
      const interaction = await AIInteractionModel.get(id);
      return interaction;
    } catch (error) {
      console.error('ERROR', 'Failed to get AI interaction:', error);
      throw error;
    }
  }

  async list(userId: string): Promise<AIInteraction[]> {
    try {
      const interactions = await AIInteractionModel.query("userId")
        .eq(userId)
        .exec();
      return interactions;
    } catch (error) {
      console.error('ERROR', 'Failed to list AI interactions:', error);
      throw error;
    }
  }

  async listAll(): Promise<any[]> {
    try {
      // Use DynamoDB scan directly to avoid schema validation issues
      const params = {
        TableName: 'hh-ai-interaction-production-ai-interactions'
      };
      
      const dynamodb = new (require('aws-sdk')).DynamoDB.DocumentClient();
      const result = await dynamodb.scan(params).promise();
      
      return result.Items || [];
    } catch (error) {
      console.error('ERROR', 'Failed to list all AI interactions:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<AIInteraction>): Promise<AIInteraction | null> {
    try {
      const interaction = await AIInteractionModel.get(id);
      if (!interaction) {
        return null;
      }

      Object.assign(interaction, data);
      await interaction.save();
      return interaction;
    } catch (error) {
      console.error('ERROR', 'Failed to update AI interaction:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await AIInteractionModel.delete(id);
      return true;
    } catch (error) {
      console.error('ERROR', 'Failed to delete AI interaction:', error);
      return false;
    }
  }

  async handleVirtualAssistant(
    query: any,
    userId: string
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      await this.initializeOpenAI();
      
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const messages = Array.isArray(query) ? query : [{ role: 'user', content: query }];

      const tools = [
        {
          type: "function" as const,
          function: {
            name: "get_available_doctors",
            description: "Get a list of available doctors",
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "create_appointment",
            description: "Create a new appointment",
            parameters: {
              type: "object",
              properties: {
                doctorId: { type: "string" },
                dateTime: { type: "string", format: "date-time" },
              },
              required: ["doctorId", "dateTime"],
            },
          },
        },
      ];

      const systemMessage = {
        role: "system",
        content: "You are an AI assistant for a healthcare application. You can answer general medical questions, provide health advice, and assist with scheduling appointments. Always prioritize patient safety and refer to professional medical advice when appropriate. When listing available doctors, always include their ID, name, specialty, and registration number. When the user confirms they want to schedule an appointment, you MUST use the create_appointment function with the doctor's ID (not registration number) and the specified time. Do not pretend to create an appointment without calling the function.",
      };

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [systemMessage, ...messages],
        tools: tools,
        tool_choice: "auto",
      });

      const assistantMessage = response.choices[0].message;

      if (assistantMessage.tool_calls) {
        const toolCall = assistantMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let functionResult = "";
        if (functionName === "get_available_doctors") {
          console.log("Get available doctors");
          // TODO: Replace with HTTP call to doctor service API
          const doctors = [
            { id: "doc-1", firstName: "Dr. Smith", specialization: "Cardiology" },
            { id: "doc-2", firstName: "Dr. Johnson", specialization: "General Practice" },
            { id: "doc-3", firstName: "Dr. Williams", specialization: "Dermatology" }
          ];
          functionResult = `Available doctors: ${JSON.stringify(
            doctors.map((doctor) => ({
              id: doctor.id,
              name: doctor.firstName,
              specialty: doctor.specialization,
            }))
          )}`;
        } else if (functionName === "create_appointment") {
          console.log("Called create_appointment", userId);
          console.log("Args", functionArgs);

          const { doctorId, dateTime } = functionArgs;

          if (!doctorId || !dateTime) {
            functionResult = "Insufficient information to create appointment";
          } else {
            // TODO: Replace with HTTP call to appointment service API
            const appointment = {
              id: `apt-${Date.now()}`,
              patientId: userId,
              doctorId,
              dateTime,
              status: "scheduled"
            };
            functionResult = `Appointment created: ${JSON.stringify(appointment)}`;
          }
        }

        const finalResponse = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            systemMessage,
            ...messages,
            { role: "function", name: functionName, content: functionResult },
            {
              role: "user",
              content: "Please provide a friendly and informative response based on this information. If an appointment was created, confirm the details to the user.",
            },
          ],
        });

        return finalResponse.choices[0].message.content || "I apologize, but I'm unable to process your request at the moment.";
      }

      return assistantMessage.content || "I apologize, but I'm unable to process your request at the moment.";
    } catch (error: any) {
      console.error('ERROR', 'Virtual assistant processing failed:', error);
      return `I'm your HealthHub AI assistant. I apologize, but I'm currently experiencing technical difficulties. Error: ${error.message}`;
    }
  }

  async processVirtualAssistant(content: string, userId: string): Promise<string> {
    try {
      // Initialize OpenAI credentials
      await this.initializeOpenAI();

      console.log('Processing virtual assistant request with real OpenAI API...');
      
      if (!this.openaiCredentials?.api_key) {
        throw new Error('OpenAI API key not available');
      }

      // Make actual OpenAI API call
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiCredentials.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful healthcare AI assistant for HealthHub. Provide professional, accurate, and empathetic responses to health-related questions. Always recommend consulting with healthcare professionals for serious concerns.'
            },
            {
              role: 'user',
              content: content
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json() as any;
        console.error('OpenAI API Error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const openaiData = await openaiResponse.json() as any;
      const aiResponse = openaiData.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';

      console.log('✅ Real OpenAI response generated successfully');
      return aiResponse;
    } catch (error: any) {
      console.error('ERROR', 'Virtual assistant processing failed:', error);
      
      // Fallback to demo response if API fails
      const fallbackResponse = `I'm your HealthHub AI assistant. I received your message: "${content}".

I apologize, but I'm currently experiencing technical difficulties connecting to the AI service. Here's what I can tell you:

🔧 **Technical Status:**
- OpenAI Integration: ${this.openaiCredentials?.api_key ? '✅ Configured' : '❌ Not configured'}
- Error: ${error.message}

For immediate health concerns, please contact your healthcare provider directly.

This is a fallback response while we resolve the technical issue.`;

      return fallbackResponse;
    }
  }

  async convertTextToSpeech(text: string): Promise<string> {
    try {
      const params = {
        Text: text,
        OutputFormat: "mp3",
        VoiceId: "Joanna",
      };

      const result = await this.polly.synthesizeSpeech(params).promise();
      
      if (result.AudioStream) {
        // Upload to S3
        const key = `speech/${uuidv4()}.mp3`;
        const uploadParams = {
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: result.AudioStream,
          ContentType: "audio/mpeg",
        };

        await this.s3.upload(uploadParams).promise();
        
        // Generate secure pre-signed URL (expires in 1 hour) - HIPAA compliant
        const signedUrl = this.s3.getSignedUrl('getObject', {
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Expires: 3600
        });
        
        return signedUrl;
      }

      throw new Error('No audio stream received from Polly');
    } catch (error) {
      console.error('ERROR', 'Text to speech conversion failed:', error);
      throw error;
    }
  }

  async textToSpeech(
    text: string,
    language: string
  ): Promise<{ audioUrl: string }> {
    try {
      const translatedText = await this.translateText(text, language);
      const audioBuffer = await this.synthesizeSpeech(translatedText, language);

      // Generate a unique ID for the file
      const fileId = uuidv4();

      // Upload the audio file to S3
      const key = `temp-audio/${fileId}.mp3`;
      await this.s3
        .putObject({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: audioBuffer,
          ContentType: "audio/mpeg",
          ACL: "public-read",
        })
        .promise();

      const audioUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;

      return { audioUrl };
    } catch (error) {
      console.error("Error in text-to-speech process:", error);
      throw new Error("Failed to process text-to-speech request");
    }
  }

  private async translateText(
    text: string,
    targetLanguage: string
  ): Promise<string> {
    try {
      const params = {
        Text: text,
        SourceLanguageCode: "auto",
        TargetLanguageCode: this.getAWSLanguageCode(targetLanguage),
      };

      const result = await this.translate.translateText(params).promise();
      return result.TranslatedText;
    } catch (error) {
      console.error("Error in translation:", error);
      throw new Error("Failed to translate text");
    }
  }

  private async synthesizeSpeech(
    text: string,
    language: string
  ): Promise<Buffer> {
    try {
      const params = {
        Text: text,
        OutputFormat: "mp3",
        VoiceId: this.getPollyVoice(language),
        LanguageCode: this.getAWSLanguageCode(language),
      };

      const result = await this.polly.synthesizeSpeech(params).promise();

      if (result.AudioStream instanceof Buffer) {
        return result.AudioStream;
      } else {
        throw new Error("AudioStream is not a Buffer");
      }
    } catch (error) {
      console.error("Error in speech synthesis:", error);
      throw new Error("Failed to synthesize speech");
    }
  }

  private getPollyVoice(language: string): string {
    switch (language) {
      case "en":
        return "Joanna";
      case "es":
        return "Penelope";
      case "pt-BR":
        return "Camila";
      default:
        return "Joanna";
    }
  }

  private getAWSLanguageCode(language: string): string {
    switch (language) {
      case "en":
        return "en-US";
      case "es":
        return "es-ES";
      case "pt-BR":
        return "pt-BR";
      default:
        return "en-US";
    }
  }
}
