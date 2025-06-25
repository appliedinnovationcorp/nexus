"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AITool, ToolUsage, ToolSettings } from "@/types/tools";

interface ToolsContextType {
  activeTools: AITool[];
  toolUsage: ToolUsage[];
  toolSettings: ToolSettings;
  addToolUsage: (usage: Omit<ToolUsage, 'id' | 'timestamp'>) => void;
  updateToolSettings: (settings: Partial<ToolSettings>) => void;
  getToolById: (id: string) => AITool | undefined;
  isToolAvailable: (toolId: string) => boolean;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [activeTools] = useState<AITool[]>([
    {
      id: 'text-generator',
      name: 'AI Text Generator',
      description: 'Generate high-quality content with advanced AI',
      category: 'content',
      icon: 'FileText',
      isActive: true,
      isPremium: false,
      version: '1.0.0',
      features: ['Content Generation', 'Multiple Formats', 'SEO Optimization'],
      pricing: { free: 1000, pro: 10000, enterprise: -1 },
      apiEndpoint: '/api/tools/text-generator',
    },
    {
      id: 'image-generator',
      name: 'AI Image Generator',
      description: 'Create stunning images from text descriptions',
      category: 'creative',
      icon: 'Image',
      isActive: true,
      isPremium: true,
      version: '1.2.0',
      features: ['Text-to-Image', 'Style Transfer', 'High Resolution'],
      pricing: { free: 10, pro: 100, enterprise: -1 },
      apiEndpoint: '/api/tools/image-generator',
    },
    {
      id: 'code-assistant',
      name: 'AI Code Assistant',
      description: 'Get help with coding, debugging, and optimization',
      category: 'development',
      icon: 'Code',
      isActive: true,
      isPremium: false,
      version: '2.1.0',
      features: ['Code Generation', 'Bug Detection', 'Optimization'],
      pricing: { free: 500, pro: 5000, enterprise: -1 },
      apiEndpoint: '/api/tools/code-assistant',
    },
    {
      id: 'data-analyzer',
      name: 'AI Data Analyzer',
      description: 'Analyze and visualize your data with AI insights',
      category: 'analytics',
      icon: 'BarChart3',
      isActive: true,
      isPremium: true,
      version: '1.5.0',
      features: ['Data Analysis', 'Visualization', 'Insights'],
      pricing: { free: 100, pro: 1000, enterprise: -1 },
      apiEndpoint: '/api/tools/data-analyzer',
    },
    {
      id: 'chatbot-builder',
      name: 'AI Chatbot Builder',
      description: 'Build intelligent chatbots for your business',
      category: 'automation',
      icon: 'MessageSquare',
      isActive: true,
      isPremium: true,
      version: '1.0.0',
      features: ['Drag & Drop', 'NLP Integration', 'Multi-platform'],
      pricing: { free: 50, pro: 500, enterprise: -1 },
      apiEndpoint: '/api/tools/chatbot-builder',
    },
    {
      id: 'voice-synthesizer',
      name: 'AI Voice Synthesizer',
      description: 'Convert text to natural-sounding speech',
      category: 'audio',
      icon: 'Mic',
      isActive: true,
      isPremium: true,
      version: '1.3.0',
      features: ['Multiple Voices', 'Emotion Control', 'SSML Support'],
      pricing: { free: 1000, pro: 10000, enterprise: -1 },
      apiEndpoint: '/api/tools/voice-synthesizer',
    },
    {
      id: 'document-processor',
      name: 'AI Document Processor',
      description: 'Extract and process information from documents',
      category: 'productivity',
      icon: 'FileSearch',
      isActive: true,
      isPremium: false,
      version: '1.1.0',
      features: ['OCR', 'Data Extraction', 'Format Conversion'],
      pricing: { free: 100, pro: 1000, enterprise: -1 },
      apiEndpoint: '/api/tools/document-processor',
    },
    {
      id: 'translation-engine',
      name: 'AI Translation Engine',
      description: 'Translate text between 100+ languages',
      category: 'language',
      icon: 'Languages',
      isActive: true,
      isPremium: false,
      version: '2.0.0',
      features: ['100+ Languages', 'Context Aware', 'Bulk Translation'],
      pricing: { free: 10000, pro: 100000, enterprise: -1 },
      apiEndpoint: '/api/tools/translation-engine',
    },
  ]);

  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    defaultModel: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
    autoSave: true,
    notifications: true,
    theme: 'system',
  });

  const addToolUsage = (usage: Omit<ToolUsage, 'id' | 'timestamp'>) => {
    const newUsage: ToolUsage = {
      ...usage,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setToolUsage(prev => [newUsage, ...prev.slice(0, 99)]); // Keep last 100 entries
  };

  const updateToolSettings = (settings: Partial<ToolSettings>) => {
    setToolSettings(prev => ({ ...prev, ...settings }));
  };

  const getToolById = (id: string) => {
    return activeTools.find(tool => tool.id === id);
  };

  const isToolAvailable = (toolId: string) => {
    const tool = getToolById(toolId);
    return tool ? tool.isActive : false;
  };

  const value = {
    activeTools,
    toolUsage,
    toolSettings,
    addToolUsage,
    updateToolSettings,
    getToolById,
    isToolAvailable,
  };

  return <ToolsContext.Provider value={value}>{children}</ToolsContext.Provider>;
}

export function useTools() {
  const context = useContext(ToolsContext);
  if (context === undefined) {
    throw new Error("useTools must be used within a ToolsProvider");
  }
  return context;
}
