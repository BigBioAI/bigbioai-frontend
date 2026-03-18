import { Message } from '@/types/chat';

export interface ChatInterfaceStoreData {
  activeDatasetId: string | null;
  messages: Message[];
  input: string;
  isLoading: boolean;
}

export interface ChatInterfaceStoreState extends ChatInterfaceStoreData {
  patch: (payload: Partial<ChatInterfaceStoreData>) => void;
  initializeChat: (datasetId: string, initialMessage?: string) => void;
  appendMessage: (message: Message) => void;
  removeMessageById: (messageId: string) => void;
}
