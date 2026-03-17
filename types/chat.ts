export type ChatRole = 'user' | 'assistant' | 'system';

export interface BaseChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface Message extends BaseChatMessage {
  metadata?: {
    datasetId?: string;
    analysisType?: string;
    error?: boolean;
    loading?: boolean;
  };
}

export interface BioAgentMessage extends Omit<BaseChatMessage, 'role'> {
  role: 'user' | 'assistant';
  figures?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  datasetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisRequest {
  message: string;
  dataset_id: string;
  analysis_type?: 'general' | 'clustering' | 'differential' | 'visualization' | 'pathway';
  parameters?: Record<string, unknown>;
}

export interface AnalysisResponse {
  message: string;
  results?: {
    type: string;
    data: unknown;
    visualization_url?: string;
    download_url?: string;
  };
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}