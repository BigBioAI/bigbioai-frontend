import { create } from 'zustand';
import { BioAgentChatStoreData, BioAgentChatStoreState } from '@/types/bioAgentChatStore.types';

const createInitialState = (): BioAgentChatStoreData => ({
  input: '',
});

export const useBioAgentChatStore = create<BioAgentChatStoreState>((set) => ({
  ...createInitialState(),
  patch: (payload) => set(payload),
  resetInput: () => set(createInitialState()),
}));
