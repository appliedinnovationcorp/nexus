// OpenAI Integration - Advanced AI capabilities for AIC platform

import OpenAI from 'openai';
import { EventEmitter } from 'events';
import { RateLimiter } from '../utils/rate-limiter';
import { RetryHandler } from '../utils/retry-handler';
import { MetricsCollector } from '../utils/metrics-collector';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  rateLimitRpm?: number; // requests per minute
  rateLimitTpm?: number; // tokens per minute
}

export interface AIAssessmentRequest {
  organizationName: string;
  industryVertical: string;
  currentState: {
    dataMaturity: number;
    techInfrastructure: number;
    talentCapability: number;
    processMaturity: number;
  };
  businessGoals: string[];
  constraints: string[];
  timeline: string;
  budget?: string;
}

export interface AIAssessmentResponse {
  maturityScore: number;
  readinessLevel: 'beginner' | 'developing' | 'intermediate' | 'advanced';
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    estimatedImpact: number;
    implementationComplexity: number;
    timeToValue: string;
    requiredInvestment: string;
  }[];
  useCases: {
    name: string;
    description: string;
    businessValue: number;
    technicalFeasibility: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedROI: number;
    prerequisites: string[];
  }[];
  roadmap: {
    phase: string;
    duration: string;
    objectives: string[];
    deliverables: string[];
    successMetrics: string[];
  }[];
  riskFactors: string[];
  successFactors: string[];
}

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  analysisType: 'quality' | 'security' | 'performance' | 'ai-readiness';
  context?: string;
}

export interface CodeAnalysisResponse {
  overallScore: number;
  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    line?: number;
    suggestion: string;
    aiReadinessImpact?: number;
  }[];
  recommendations: string[];
  aiOpportunities: {
    area: string;
    description: string;
    potentialBenefit: string;
    implementationEffort: 'low' | 'medium' | 'high';
  }[];
}

export class OpenAIIntegration extends EventEmitter {
  private client: OpenAI;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  private metrics: MetricsCollector;

  constructor(config: OpenAIConfig) {
    super();
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseURL,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 60000,
    });

    this.rateLimiter = new RateLimiter({
      requestsPerMinute: config.rateLimitRpm || 3500,
      tokensPerMinute: config.rateLimitTpm || 90000,
    });

    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    });

    this.metrics = new MetricsCollector('openai-integration');
  }

  /**
   * Generate comprehensive AI readiness assessment
   */
  async generateAIAssessment(request: AIAssessmentRequest): Promise<AIAssessmentResponse> {
    const startTime = Date.now();
    
    try {
      await this.rateLimiter.waitForCapacity(1, 4000); // Estimate 4000 tokens

      const prompt = this.buildAssessmentPrompt(request);
      
      const response = await this.retryHandler.execute(async () => {
        return await this.client.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an expert AI consultant at Applied Innovation Corporation (AIC), specializing in AI transformation and readiness assessments. You help organizations understand their AI maturity and create actionable roadmaps for AI adoption. Provide detailed, practical, and industry-specific recommendations.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        });
      });

      const assessment = JSON.parse(response.choices[0].message.content!) as AIAssessmentResponse;
      
      this.metrics.recordSuccess('ai_assessment', Date.now() - startTime);
      this.emit('assessment_completed', { request, assessment });
      
      return assessment;
      
    } catch (error) {
      this.metrics.recordError('ai_assessment', error as Error);
      this.emit('assessment_failed', { request, error });
      throw error;
    }
  }

  /**
   * Analyze code for AI readiness and opportunities
   */
  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      const tokenEstimate = Math.min(request.code.length / 4, 8000); // Rough token estimate
      await this.rateLimiter.waitForCapacity(1, tokenEstimate);

      const prompt = this.buildCodeAnalysisPrompt(request);
      
      const response = await this.retryHandler.execute(async () => {
        return await this.client.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a senior software architect and AI consultant at AIC. Analyze code for quality, security, performance, and AI integration opportunities. Focus on practical recommendations that enable AI adoption and improve overall system architecture.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        });
      });

      const analysis = JSON.parse(response.choices[0].message.content!) as CodeAnalysisResponse;
      
      this.metrics.recordSuccess('code_analysis', Date.now() - startTime);
      this.emit('code_analysis_completed', { request, analysis });
      
      return analysis;
      
    } catch (error) {
      this.metrics.recordError('code_analysis', error as Error);
      this.emit('code_analysis_failed', { request, error });
      throw error;
    }
  }

  /**
   * Generate AI use case recommendations
   */
  async generateUseCases(
    industryVertical: string,
    businessContext: string,
    constraints: string[]
  ): Promise<{
    useCases: Array<{
      name: string;
      description: string;
      businessValue: number;
      technicalComplexity: number;
      timeToImplement: string;
      estimatedROI: number;
      prerequisites: string[];
      riskFactors: string[];
    }>;
    priorityMatrix: {
      quickWins: string[];
      strategic: string[];
      transformational: string[];
    };
  }> {
    const startTime = Date.now();
    
    try {
      await this.rateLimiter.waitForCapacity(1, 3000);

      const response = await this.retryHandler.execute(async () => {
        return await this.client.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an AI strategy consultant at AIC. Generate specific, actionable AI use cases tailored to the client's industry and context. Focus on practical implementations with clear business value and realistic timelines.`
            },
            {
              role: 'user',
              content: `Generate AI use cases for:
Industry: ${industryVertical}
Business Context: ${businessContext}
Constraints: ${constraints.join(', ')}

Provide detailed use cases with business value scores (0-100), technical complexity (0-100), ROI estimates, and implementation timelines. Categorize into quick wins, strategic initiatives, and transformational projects.`
            }
          ],
          temperature: 0.4,
          max_tokens: 3000,
          response_format: { type: 'json_object' }
        });
      });

      const result = JSON.parse(response.choices[0].message.content!);
      
      this.metrics.recordSuccess('use_case_generation', Date.now() - startTime);
      this.emit('use_cases_generated', { industryVertical, result });
      
      return result;
      
    } catch (error) {
      this.metrics.recordError('use_case_generation', error as Error);
      throw error;
    }
  }

  /**
   * Generate technical documentation
   */
  async generateDocumentation(
    type: 'api' | 'architecture' | 'user-guide' | 'technical-spec',
    context: string,
    requirements: string[]
  ): Promise<{
    title: string;
    content: string;
    sections: Array<{
      title: string;
      content: string;
      subsections?: Array<{
        title: string;
        content: string;
      }>;
    }>;
    metadata: {
      wordCount: number;
      estimatedReadTime: number;
      complexity: 'beginner' | 'intermediate' | 'advanced';
    };
  }> {
    const startTime = Date.now();
    
    try {
      await this.rateLimiter.waitForCapacity(1, 4000);

      const response = await this.retryHandler.execute(async () => {
        return await this.client.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a technical writer at AIC specializing in AI and software documentation. Create comprehensive, well-structured documentation that is clear, accurate, and actionable.`
            },
            {
              role: 'user',
              content: `Generate ${type} documentation for:
Context: ${context}
Requirements: ${requirements.join('\n- ')}

Create structured documentation with clear sections, examples, and practical guidance.`
            }
          ],
          temperature: 0.2,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        });
      });

      const documentation = JSON.parse(response.choices[0].message.content!);
      
      this.metrics.recordSuccess('documentation_generation', Date.now() - startTime);
      this.emit('documentation_generated', { type, documentation });
      
      return documentation;
      
    } catch (error) {
      this.metrics.recordError('documentation_generation', error as Error);
      throw error;
    }
  }

  /**
   * Generate client presentation content
   */
  async generatePresentationContent(
    presentationType: 'assessment-results' | 'project-proposal' | 'progress-update' | 'final-report',
    clientContext: {
      organizationName: string;
      industryVertical: string;
      keyStakeholders: string[];
      projectScope: string;
    },
    data: any
  ): Promise<{
    slides: Array<{
      title: string;
      content: string;
      speakerNotes: string;
      visualSuggestions: string[];
    }>;
    executiveSummary: string;
    keyTakeaways: string[];
    nextSteps: string[];
  }> {
    const startTime = Date.now();
    
    try {
      await this.rateLimiter.waitForCapacity(1, 3500);

      const response = await this.retryHandler.execute(async () => {
        return await this.client.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a senior consultant at AIC creating executive-level presentations. Focus on business value, clear recommendations, and actionable next steps. Tailor content to the audience and maintain AIC's professional standards.`
            },
            {
              role: 'user',
              content: `Create a ${presentationType} presentation for ${clientContext.organizationName} (${clientContext.industryVertical}).

Client Context:
- Key Stakeholders: ${clientContext.keyStakeholders.join(', ')}
- Project Scope: ${clientContext.projectScope}

Data: ${JSON.stringify(data, null, 2)}

Generate professional presentation content with clear business focus and actionable recommendations.`
            }
          ],
          temperature: 0.3,
          max_tokens: 3500,
          response_format: { type: 'json_object' }
        });
      });

      const presentation = JSON.parse(response.choices[0].message.content!);
      
      this.metrics.recordSuccess('presentation_generation', Date.now() - startTime);
      this.emit('presentation_generated', { presentationType, presentation });
      
      return presentation;
      
    } catch (error) {
      this.metrics.recordError('presentation_generation', error as Error);
      throw error;
    }
  }

  private buildAssessmentPrompt(request: AIAssessmentRequest): string {
    return `Conduct a comprehensive AI readiness assessment for ${request.organizationName} in the ${request.industryVertical} industry.

Current State Assessment:
- Data Maturity: ${request.currentState.dataMaturity}/100
- Tech Infrastructure: ${request.currentState.techInfrastructure}/100
- Talent Capability: ${request.currentState.talentCapability}/100
- Process Maturity: ${request.currentState.processMaturity}/100

Business Goals: ${request.businessGoals.join(', ')}
Constraints: ${request.constraints.join(', ')}
Timeline: ${request.timeline}
${request.budget ? `Budget: ${request.budget}` : ''}

Provide a detailed assessment in JSON format with:
1. Overall maturity score and readiness level
2. Prioritized recommendations with impact and complexity scores
3. Specific AI use cases with business value and feasibility scores
4. Phased implementation roadmap
5. Risk factors and success factors

Focus on practical, actionable recommendations that align with AIC's consulting methodology.`;
  }

  private buildCodeAnalysisPrompt(request: CodeAnalysisRequest): string {
    return `Analyze the following ${request.language} code for ${request.analysisType}:

${request.context ? `Context: ${request.context}` : ''}

Code:
\`\`\`${request.language}
${request.code}
\`\`\`

Provide analysis in JSON format with:
1. Overall quality score (0-100)
2. Specific issues with severity levels and suggestions
3. General recommendations for improvement
4. AI integration opportunities and benefits

Focus on practical improvements that enhance code quality and enable AI adoption.`;
  }

  /**
   * Get integration health metrics
   */
  getMetrics() {
    return this.metrics.getMetrics();
  }

  /**
   * Test connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      this.emit('connection_failed', error);
      return false;
    }
  }
}
