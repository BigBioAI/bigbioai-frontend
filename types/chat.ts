export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    datasetId?: string;
    analysisType?: string;
    error?: boolean;
    loading?: boolean;
  };
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
  parameters?: Record<string, any>;
}

export interface AnalysisResponse {
  message: string;
  results?: {
    type: string;
    data: any;
    visualization_url?: string;
    download_url?: string;
  };
  suggestions?: string[];
  metadata?: Record<string, any>;
}