import { create } from 'zustand';
import { BioAgentStoreData, BioAgentStoreState } from '@/types/bioAgentStore.types';

const createInitialState = (): BioAgentStoreData => ({
  isLoading: false,
  extractedParams: null,
  datasetInfo: null,
  googleDriveLink: '',
  currentPhase: 'upload',
  messages: [],
  input: '',
  sessionId: '',
  isChatLoading: false,
});

export const useBioAgentStore = create<BioAgentStoreState>((set) => ({
  ...createInitialState(),
  patch: (payload) => set(payload),
  replaceMessages: (messages) => set({ messages }),
  appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  resetWorkflow: () => set(createInitialState()),
}));
