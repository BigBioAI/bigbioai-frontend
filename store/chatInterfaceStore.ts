import { create } from 'zustand';
import { Message } from '@/types/chat';
import { ChatInterfaceStoreData, ChatInterfaceStoreState } from '@/types/chatInterfaceStore.types';

const buildWelcomeMessage = (initialMessage?: string): Message => ({
  id: '1',
  role: 'assistant',
  content: initialMessage?.trim() || '안녕하세요! 업로드하신 단세포 RNA 데이터 분석을 도와드리겠습니다. 어떤 분석을 시작하시겠어요?',
  timestamp: new Date(),
});

const createInitialState = (): ChatInterfaceStoreData => ({
  activeDatasetId: null,
  messages: [buildWelcomeMessage()],
  input: '',
  isLoading: false,
});

export const useChatInterfaceStore = create<ChatInterfaceStoreState>((set, get) => ({
  ...createInitialState(),
  patch: (payload) => set(payload),
  initializeChat: (datasetId, initialMessage) => {
    if (get().activeDatasetId === datasetId) {
      return;
    }

    set({
      ...createInitialState(),
      activeDatasetId: datasetId,
      messages: [buildWelcomeMessage(initialMessage)],
    });
  },
  appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  removeMessageById: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((message) => message.id !== messageId),
    })),
}));
