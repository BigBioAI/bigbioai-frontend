export interface BioAgentChatStoreData {
  input: string;
}

export interface BioAgentChatStoreState extends BioAgentChatStoreData {
  patch: (payload: Partial<BioAgentChatStoreData>) => void;
  resetInput: () => void;
}
