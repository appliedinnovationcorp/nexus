export interface AITool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  isActive: boolean;
  isPremium: boolean;
  version: string;
  features: string[];
  pricing: ToolPricing;
  apiEndpoint: string;
  documentation?: string;
  examples?: ToolExample[];
}

export type ToolCategory = 
  | 'content' 
  | 'creative' 
  | 'development' 
  | 'analytics' 
  | 'automation' 
  | 'audio' 
  | 'productivity' 
  | 'language';

export interface ToolPricing {
  free: number; // usage limit for free tier
  pro: number; // usage limit for pro tier
  enterprise: number; // -1 for unlimited
}

export interface ToolExample {
  title: string;
  description: string;
  input: any;
  output: any;
}

export interface ToolUsage {
  id: string;
  toolId: string;
  userId: string;
  timestamp: string;
  inputTokens?: number;
  outputTokens?: number;
  processingTime: number; // milliseconds
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface ToolSettings {
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  autoSave: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Text Generator Types
export interface TextGenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  format?: 'paragraph' | 'bullet-points' | 'outline' | 'article';
  tone?: 'professional' | 'casual' | 'creative' | 'technical';
  language?: string;
}

export interface TextGenerationResponse {
  text: string;
  tokensUsed: number;
  model: string;
  processingTime: number;
}

// Image Generator Types
export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract';
  size?: '256x256' | '512x512' | '1024x1024';
  quality?: 'standard' | 'hd';
  count?: number;
}

export interface ImageGenerationResponse {
  images: GeneratedImage[];
  prompt: string;
  processingTime: number;
}

export interface GeneratedImage {
  url: string;
  size: string;
  format: string;
}

// Code Assistant Types
export interface CodeAssistanceRequest {
  code?: string;
  language: string;
  task: 'generate' | 'debug' | 'optimize' | 'explain' | 'convert';
  description: string;
  targetLanguage?: string; // for conversion
}

export interface CodeAssistanceResponse {
  code: string;
  explanation: string;
  suggestions: string[];
  language: string;
  processingTime: number;
}

// Data Analyzer Types
export interface DataAnalysisRequest {
  data: any[] | string; // JSON array or CSV string
  analysisType: 'summary' | 'correlation' | 'prediction' | 'visualization';
  columns?: string[];
  targetColumn?: string; // for prediction
}

export interface DataAnalysisResponse {
  summary: DataSummary;
  insights: string[];
  visualizations?: ChartData[];
  recommendations: string[];
  processingTime: number;
}

export interface DataSummary {
  rowCount: number;
  columnCount: number;
  missingValues: Record<string, number>;
  dataTypes: Record<string, string>;
  statistics: Record<string, any>;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
}

// Voice Synthesizer Types
export interface VoiceSynthesisRequest {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm';
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface VoiceSynthesisResponse {
  audioUrl: string;
  duration: number; // seconds
  format: string;
  charactersProcessed: number;
  processingTime: number;
}

// Document Processor Types
export interface DocumentProcessingRequest {
  file: File | string; // File object or base64 string
  task: 'extract-text' | 'extract-data' | 'convert' | 'summarize';
  outputFormat?: 'json' | 'csv' | 'txt' | 'pdf';
  extractionRules?: ExtractionRule[];
}

export interface ExtractionRule {
  field: string;
  pattern: string;
  required: boolean;
}

export interface DocumentProcessingResponse {
  extractedText?: string;
  extractedData?: Record<string, any>;
  summary?: string;
  convertedFile?: string; // base64 or URL
  confidence: number;
  processingTime: number;
}

// Translation Types
export interface TranslationRequest {
  text: string;
  sourceLanguage?: string; // auto-detect if not provided
  targetLanguage: string;
  preserveFormatting?: boolean;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  charactersProcessed: number;
  processingTime: number;
}

// Chatbot Builder Types
export interface ChatbotConfig {
  id: string;
  name: string;
  description: string;
  personality: string;
  knowledgeBase: string[];
  intents: ChatbotIntent[];
  responses: ChatbotResponse[];
  settings: ChatbotSettings;
}

export interface ChatbotIntent {
  name: string;
  examples: string[];
  entities: string[];
}

export interface ChatbotResponse {
  intent: string;
  responses: string[];
  actions?: string[];
}

export interface ChatbotSettings {
  fallbackMessage: string;
  confidenceThreshold: number;
  enableSmallTalk: boolean;
  enableAnalytics: boolean;
}
