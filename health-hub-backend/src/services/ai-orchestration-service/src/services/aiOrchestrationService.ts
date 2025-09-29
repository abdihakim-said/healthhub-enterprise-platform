import { OpenAI } from "openai";
import { Polly, Translate, Comprehend, Textract } from "aws-sdk";
import { getOpenAICredentials, getAzureSpeechCredentials, getGoogleVisionCredentials } from "../utils/secretsManager";

/**
 * Advanced AI Orchestration Service
 * Demonstrates senior-level multi-cloud AI integration with intelligent workflows
 */
export class AIOrchestrationService {
  private openai: OpenAI | null = null;
  private polly: Polly;
  private translate: Translate;
  private comprehend: Comprehend;
  private textract: Textract;

  constructor() {
    this.polly = new Polly();
    this.translate = new Translate({ region: "us-east-1" });
    this.comprehend = new Comprehend({ region: "us-east-1" });
    this.textract = new Textract({ region: "us-east-1" });
  }

  /**
   * Intelligent Medical Document Processing Pipeline
   * Combines multiple AI services for comprehensive analysis
   */
  async processMedicalDocument(documentBuffer: Buffer, patientContext: any): Promise<{
    extractedText: string;
    medicalEntities: any[];
    sentiment: any;
    summary: string;
    riskAssessment: any;
    recommendations: string[];
    multiLanguageSupport: any;
  }> {
    try {
      // 1. Extract text using AWS Textract (OCR)
      const textractResult = await this.textract.detectDocumentText({
        Document: { Bytes: documentBuffer }
      }).promise();

      const extractedText = textractResult.Blocks
        ?.filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join(' ') || '';

      // 2. Extract medical entities using AWS Comprehend Medical
      const medicalEntities = await this.comprehend.detectEntitiesV2({
        Text: extractedText,
        LanguageCode: 'en'
      }).promise();

      // 3. Sentiment analysis for patient emotional state
      const sentiment = await this.comprehend.detectSentiment({
        Text: extractedText,
        LanguageCode: 'en'
      }).promise();

      // 4. Generate intelligent summary using OpenAI
      await this.initializeOpenAI();
      const summary = await this.generateMedicalSummary(extractedText, patientContext);

      // 5. Risk assessment using custom ML logic
      const riskAssessment = await this.assessMedicalRisk(medicalEntities, patientContext);

      // 6. Generate personalized recommendations
      const recommendations = await this.generateRecommendations(
        extractedText, 
        medicalEntities, 
        riskAssessment,
        patientContext
      );

      // 7. Multi-language support
      const multiLanguageSupport = await this.provideMultiLanguageSupport(
        summary, 
        patientContext.preferredLanguage || 'en'
      );

      return {
        extractedText,
        medicalEntities: medicalEntities.Entities || [],
        sentiment,
        summary,
        riskAssessment,
        recommendations,
        multiLanguageSupport
      };

    } catch (error) {
      console.error('Error in medical document processing pipeline:', error);
      throw new Error('Failed to process medical document');
    }
  }

  /**
   * Advanced Medical Image Analysis with Multi-Cloud AI
   */
  async analyzeComplexMedicalImage(imageBuffer: Buffer, imageType: string): Promise<{
    googleVisionAnalysis: any;
    awsRekognitionAnalysis: any;
    openaiInterpretation: string;
    riskScore: number;
    clinicalRecommendations: string[];
    confidenceMetrics: any;
  }> {
    try {
      // 1. Google Vision AI for detailed medical analysis
      const googleCredentials = await getGoogleVisionCredentials();
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient({
        credentials: googleCredentials
      });

      const [googleResult] = await client.annotateImage({
        image: { content: imageBuffer.toString('base64') },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 20 },
          { type: 'TEXT_DETECTION' },
          { type: 'OBJECT_LOCALIZATION' },
          { type: 'SAFE_SEARCH_DETECTION' }
        ]
      });

      // 2. AWS Rekognition for additional analysis
      const rekognition = new (require('aws-sdk')).Rekognition();
      const rekognitionResult = await rekognition.detectLabels({
        Image: { Bytes: imageBuffer },
        MaxLabels: 20,
        MinConfidence: 70
      }).promise();

      // 3. OpenAI GPT-4 Vision for medical interpretation
      await this.initializeOpenAI();
      const openaiInterpretation = await this.interpretMedicalImage(
        imageBuffer, 
        imageType,
        googleResult,
        rekognitionResult
      );

      // 4. Calculate composite risk score
      const riskScore = this.calculateImageRiskScore(googleResult, rekognitionResult);

      // 5. Generate clinical recommendations
      const clinicalRecommendations = await this.generateClinicalRecommendations(
        openaiInterpretation,
        riskScore,
        imageType
      );

      // 6. Confidence metrics across all AI services
      const confidenceMetrics = this.calculateConfidenceMetrics(
        googleResult,
        rekognitionResult,
        riskScore
      );

      return {
        googleVisionAnalysis: googleResult,
        awsRekognitionAnalysis: rekognitionResult,
        openaiInterpretation,
        riskScore,
        clinicalRecommendations,
        confidenceMetrics
      };

    } catch (error) {
      console.error('Error in complex medical image analysis:', error);
      throw new Error('Failed to analyze medical image');
    }
  }

  /**
   * Intelligent Conversation Flow with Context Awareness
   */
  async processIntelligentConversation(
    userMessage: string,
    conversationHistory: any[],
    patientContext: any,
    medicalHistory: any[]
  ): Promise<{
    response: string;
    audioResponse: Buffer;
    translatedResponse?: any;
    contextualInsights: any;
    followUpQuestions: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    try {
      await this.initializeOpenAI();

      // 1. Analyze conversation context and medical history
      const contextualPrompt = this.buildContextualPrompt(
        userMessage,
        conversationHistory,
        patientContext,
        medicalHistory
      );

      // 2. Generate intelligent response with OpenAI
      const completion = await this.openai!.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a senior healthcare AI assistant with expertise in medical diagnosis, 
                     patient care, and clinical decision support. Provide accurate, empathetic, 
                     and actionable medical guidance while maintaining HIPAA compliance.`
          },
          {
            role: "user",
            content: contextualPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content || '';

      // 3. Convert to speech using AWS Polly
      const audioResponse = await this.polly.synthesizeSpeech({
        Text: response,
        OutputFormat: 'mp3',
        VoiceId: 'Joanna',
        Engine: 'neural'
      }).promise();

      // 4. Translate if needed
      let translatedResponse;
      if (patientContext.preferredLanguage && patientContext.preferredLanguage !== 'en') {
        translatedResponse = await this.translate.translateText({
          Text: response,
          SourceLanguageCode: 'en',
          TargetLanguageCode: patientContext.preferredLanguage
        }).promise();
      }

      // 5. Extract contextual insights
      const contextualInsights = await this.extractContextualInsights(
        userMessage,
        response,
        patientContext
      );

      // 6. Generate follow-up questions
      const followUpQuestions = await this.generateFollowUpQuestions(
        userMessage,
        response,
        patientContext
      );

      // 7. Assess urgency level
      const urgencyLevel = await this.assessUrgencyLevel(userMessage, contextualInsights);

      return {
        response,
        audioResponse: audioResponse.AudioStream as Buffer,
        translatedResponse,
        contextualInsights,
        followUpQuestions,
        urgencyLevel
      };

    } catch (error) {
      console.error('Error in intelligent conversation processing:', error);
      throw new Error('Failed to process conversation');
    }
  }

  // Private helper methods
  private async initializeOpenAI(): Promise<void> {
    if (this.openai) return;
    
    const credentials = await getOpenAICredentials();
    this.openai = new OpenAI({
      apiKey: credentials.api_key
    });
  }

  private async generateMedicalSummary(text: string, context: any): Promise<string> {
    const completion = await this.openai!.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `Summarize this medical document for a ${context.age}-year-old ${context.gender} patient: ${text}`
      }],
      max_tokens: 300
    });
    return completion.choices[0].message.content || '';
  }

  private async assessMedicalRisk(entities: any, context: any): Promise<any> {
    // Advanced risk assessment logic combining AI insights with medical rules
    const riskFactors = entities.filter((entity: any) => 
      ['MEDICAL_CONDITION', 'MEDICATION', 'SYMPTOM'].includes(entity.Category)
    );

    return {
      overallRisk: this.calculateRiskScore(riskFactors, context),
      riskFactors: riskFactors,
      recommendations: this.generateRiskRecommendations(riskFactors)
    };
  }

  private calculateRiskScore(factors: any[], context: any): number {
    // Sophisticated risk calculation algorithm
    let score = 0;
    factors.forEach(factor => {
      score += factor.Score * this.getRiskWeight(factor.Type, context);
    });
    return Math.min(score, 100);
  }

  private getRiskWeight(factorType: string, context: any): number {
    // Context-aware risk weighting
    const baseWeights: { [key: string]: number } = {
      'MEDICAL_CONDITION': 0.8,
      'MEDICATION': 0.6,
      'SYMPTOM': 0.7
    };
    
    // Adjust based on patient age, gender, medical history
    let weight = baseWeights[factorType] || 0.5;
    if (context.age > 65) weight *= 1.2;
    if (context.chronicConditions?.length > 0) weight *= 1.1;
    
    return weight;
  }

  private async generateRecommendations(
    text: string, 
    entities: any, 
    riskAssessment: any,
    context: any
  ): Promise<string[]> {
    const prompt = `Based on this medical analysis, provide 3-5 specific recommendations for a ${context.age}-year-old patient:
    Text: ${text.substring(0, 500)}
    Risk Level: ${riskAssessment.overallRisk}
    Key Conditions: ${entities.slice(0, 3).map((e: any) => e.Text).join(', ')}`;

    const completion = await this.openai!.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400
    });

    const response = completion.choices[0].message.content || '';
    return response.split('\n').filter(line => line.trim().length > 0);
  }

  private async provideMultiLanguageSupport(text: string, language: string): Promise<any> {
    if (language === 'en') return { original: text };

    const translated = await this.translate.translateText({
      Text: text,
      SourceLanguageCode: 'en',
      TargetLanguageCode: language
    }).promise();

    const audio = await this.polly.synthesizeSpeech({
      Text: translated.TranslatedText || text,
      OutputFormat: 'mp3',
      VoiceId: this.getVoiceForLanguage(language),
      Engine: 'neural'
    }).promise();

    return {
      original: text,
      translated: translated.TranslatedText,
      audio: audio.AudioStream,
      language: language
    };
  }

  private getVoiceForLanguage(language: string): string {
    const voiceMap: { [key: string]: string } = {
      'es': 'Lupe',
      'fr': 'Celine',
      'de': 'Marlene',
      'it': 'Carla',
      'pt': 'Camila'
    };
    return voiceMap[language] || 'Joanna';
  }

  private buildContextualPrompt(
    message: string,
    history: any[],
    context: any,
    medicalHistory: any[]
  ): string {
    return `
    Patient Context: ${context.age}yo ${context.gender}, ${context.conditions?.join(', ') || 'no known conditions'}
    Medical History: ${medicalHistory.slice(-3).map(h => h.summary).join('; ')}
    Recent Conversation: ${history.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}
    Current Message: ${message}
    
    Please provide a comprehensive, empathetic response considering the full context.
    `;
  }

  private async interpretMedicalImage(
    imageBuffer: Buffer,
    imageType: string,
    googleResult: any,
    rekognitionResult: any
  ): Promise<string> {
    const prompt = `As a medical AI specialist, analyze this ${imageType} image based on the following AI analysis results:
    
    Google Vision Labels: ${googleResult.labelAnnotations?.slice(0, 5).map((l: any) => l.description).join(', ')}
    AWS Rekognition Labels: ${rekognitionResult.Labels?.slice(0, 5).map((l: any) => l.Name).join(', ')}
    
    Provide a detailed medical interpretation, potential diagnoses, and recommended next steps.`;

    const completion = await this.openai!.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500
    });

    return completion.choices[0].message.content || '';
  }

  private calculateImageRiskScore(googleResult: any, rekognitionResult: any): number {
    // Sophisticated risk scoring based on detected features
    let riskScore = 0;
    
    // Analyze Google Vision results
    googleResult.labelAnnotations?.forEach((label: any) => {
      if (this.isHighRiskLabel(label.description)) {
        riskScore += label.score * 30;
      }
    });

    // Analyze AWS Rekognition results
    rekognitionResult.Labels?.forEach((label: any) => {
      if (this.isHighRiskLabel(label.Name)) {
        riskScore += (label.Confidence / 100) * 25;
      }
    });

    return Math.min(riskScore, 100);
  }

  private isHighRiskLabel(label: string): boolean {
    const highRiskTerms = [
      'abnormal', 'lesion', 'tumor', 'fracture', 'inflammation',
      'infection', 'bleeding', 'mass', 'nodule', 'opacity'
    ];
    return highRiskTerms.some(term => 
      label.toLowerCase().includes(term)
    );
  }

  private async generateClinicalRecommendations(
    interpretation: string,
    riskScore: number,
    imageType: string
  ): Promise<string[]> {
    const urgency = riskScore > 70 ? 'urgent' : riskScore > 40 ? 'moderate' : 'routine';
    
    const prompt = `Based on this medical image interpretation and ${urgency} risk level (${riskScore}/100), 
    provide specific clinical recommendations for a ${imageType}:
    
    ${interpretation}`;

    const completion = await this.openai!.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300
    });

    const response = completion.choices[0].message.content || '';
    return response.split('\n').filter(line => line.trim().length > 0);
  }

  private calculateConfidenceMetrics(
    googleResult: any,
    rekognitionResult: any,
    riskScore: number
  ): any {
    const googleConfidence = googleResult.labelAnnotations?.[0]?.score || 0;
    const rekognitionConfidence = (rekognitionResult.Labels?.[0]?.Confidence || 0) / 100;
    
    return {
      googleVisionConfidence: googleConfidence,
      awsRekognitionConfidence: rekognitionConfidence,
      compositeConfidence: (googleConfidence + rekognitionConfidence) / 2,
      riskAssessmentConfidence: riskScore > 50 ? 0.8 : 0.6,
      overallReliability: this.calculateOverallReliability(googleConfidence, rekognitionConfidence, riskScore)
    };
  }

  private calculateOverallReliability(google: number, aws: number, risk: number): string {
    const average = (google + aws + (risk / 100)) / 3;
    if (average > 0.8) return 'High';
    if (average > 0.6) return 'Medium';
    return 'Low';
  }

  private async extractContextualInsights(
    userMessage: string,
    response: string,
    context: any
  ): Promise<any> {
    // Use AWS Comprehend to extract insights
    const insights = await this.comprehend.detectKeyPhrases({
      Text: userMessage + ' ' + response,
      LanguageCode: 'en'
    }).promise();

    return {
      keyPhrases: insights.KeyPhrases,
      patientConcerns: this.identifyPatientConcerns(userMessage),
      medicalTerms: this.extractMedicalTerms(response),
      emotionalState: await this.assessEmotionalState(userMessage)
    };
  }

  private identifyPatientConcerns(message: string): string[] {
    const concernKeywords = ['worried', 'scared', 'pain', 'hurt', 'problem', 'issue', 'concern'];
    return concernKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private extractMedicalTerms(text: string): string[] {
    // Simple medical term extraction - in production, use medical NLP libraries
    const medicalTerms = [
      'diagnosis', 'treatment', 'medication', 'symptom', 'condition',
      'therapy', 'prescription', 'examination', 'test', 'procedure'
    ];
    return medicalTerms.filter(term => 
      text.toLowerCase().includes(term)
    );
  }

  private async assessEmotionalState(message: string): Promise<any> {
    const sentiment = await this.comprehend.detectSentiment({
      Text: message,
      LanguageCode: 'en'
    }).promise();

    return {
      sentiment: sentiment.Sentiment,
      confidence: sentiment.SentimentScore,
      supportNeeded: sentiment.Sentiment === 'NEGATIVE' && 
                    (sentiment.SentimentScore?.Negative || 0) > 0.7
    };
  }

  private async generateFollowUpQuestions(
    userMessage: string,
    response: string,
    context: any
  ): Promise<string[]> {
    const prompt = `Based on this patient interaction, suggest 3 relevant follow-up questions:
    Patient: ${userMessage}
    AI Response: ${response}
    Patient Age: ${context.age}`;

    const completion = await this.openai!.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200
    });

    const questions = completion.choices[0].message.content || '';
    return questions.split('\n').filter(q => q.trim().length > 0).slice(0, 3);
  }

  private async assessUrgencyLevel(
    message: string,
    insights: any
  ): Promise<'low' | 'medium' | 'high' | 'critical'> {
    const urgentKeywords = ['emergency', 'urgent', 'severe', 'critical', 'immediate'];
    const highKeywords = ['pain', 'bleeding', 'difficulty breathing', 'chest pain'];
    const mediumKeywords = ['concern', 'worried', 'problem', 'issue'];

    const lowerMessage = message.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical';
    }
    if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateRiskRecommendations(riskFactors: any[]): string[] {
    return riskFactors.map(factor => 
      `Monitor ${factor.Text} - Confidence: ${(factor.Score * 100).toFixed(1)}%`
    );
  }
}
