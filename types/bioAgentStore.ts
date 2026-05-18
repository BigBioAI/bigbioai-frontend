import { LoadDatasetResponse, PreprocessingParams } from '@/lib/api/dataset';
import { BioAgentMessage } from '@/types/chat';

export type BioAgentPhase = 'upload' | 'process' | 'chat';

export type ProgressStatus =
  | 'idle'
  | 'downloading_data'
  | 'extracting_params'
  | 'preprocessing'
  | 'ai_analyzing'
  | 'generating_response'
  | 'complete'
  | 'error';

export interface ProgressDetail {
  status: ProgressStatus;
  message: string;
  percentage?: number;
  substeps?: string[];
}

export interface BioAgentStoreData {
  isLoading: boolean;
  extractedParams: PreprocessingParams | null;
  datasetInfo: LoadDatasetResponse | null;
  rawId: string;
  googleDriveLink: string;
  currentPhase: BioAgentPhase;
  messages: BioAgentMessage[];
  input: string;
  sessionId: string;
  isChatLoading: boolean;
  progressDetail: ProgressDetail;
}

export interface BioAgentStoreState extends BioAgentStoreData {
  patch: (payload: Partial<BioAgentStoreData>) => void;
  replaceMessages: (messages: BioAgentMessage[]) => void;
  appendMessage: (message: BioAgentMessage) => void;
  resetWorkflow: () => void;
}
