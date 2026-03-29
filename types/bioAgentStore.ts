import { LoadDatasetResponse, PreprocessingParams } from '@/lib/api/dataset';
import { BioAgentMessage } from '@/types/chat';

export type BioAgentPhase = 'upload' | 'process' | 'chat';

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
}

export interface BioAgentStoreState extends BioAgentStoreData {
  patch: (payload: Partial<BioAgentStoreData>) => void;
  replaceMessages: (messages: BioAgentMessage[]) => void;
  appendMessage: (message: BioAgentMessage) => void;
  resetWorkflow: () => void;
}
