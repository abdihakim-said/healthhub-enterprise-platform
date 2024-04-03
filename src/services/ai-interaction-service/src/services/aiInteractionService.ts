import * as dynamoose from "dynamoose";
import { Document } from "dynamoose/dist/Document";
import { Polly, Translate, S3 } from "aws-sdk";
import pkg2 from "uuid";
const { v4: uuidv4 } = pkg2;
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
  private openaiCredentials: { api_key: string; assistant_id: string } | null = null;

  constructor() {
    this.polly = new Polly();
    this.translate = new Translate({ region: "us-east-1" });
    this.s3 = new S3();
  }

  /**
   * Initialize OpenAI credentials from Secrets Manager
   */
  private async initializeOpenAI(): Promise<void> {
    if (this.openaiCredentials) {
      return; // Already initialized
    }

    try {
      console.log('Initializing OpenAI with Secrets Manager credentials...');
      this.openaiCredentials = await getOpenAICredentials();
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
        const errorData = await openaiResponse.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const openaiData = await openaiResponse.json();
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
        
        const audioUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
        return audioUrl;
      }

      throw new Error('No audio stream received from Polly');
    } catch (error) {
      console.error('ERROR', 'Text to speech conversion failed:', error);
      throw error;
    }
  }

  async translateText(text: string, targetLanguage: string = 'en'): Promise<string> {
    try {
      const params = {
        Text: text,
        SourceLanguageCode: 'auto',
        TargetLanguageCode: targetLanguage,
      };

      const result = await this.translate.translateText(params).promise();
      return result.TranslatedText || text;
    } catch (error) {
      console.error('ERROR', 'Text translation failed:', error);
      throw error;
    }
  }
}
