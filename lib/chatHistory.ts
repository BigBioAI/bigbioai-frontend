import type { LoadDatasetResponse } from "@/lib/api/dataset";

const CHAT_HISTORY_STORAGE_KEY = "bigbioai_chat_history";
const CHAT_HISTORY_UPDATED_EVENT = "chat-history-updated";
const MAX_HISTORY_ITEMS = 30;

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  figures?: string[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  sessionId: string;
  datasetId: string;
  datasetInfo: LoadDatasetResponse;
  messages: ChatHistoryMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface PersistedChatHistoryMessage extends Omit<
  ChatHistoryMessage,
  "timestamp"
> {
  timestamp: string;
}

interface PersistedChatHistoryItem extends Omit<
  ChatHistoryItem,
  "messages" | "createdAt" | "updatedAt"
> {
  messages: PersistedChatHistoryMessage[];
  createdAt: string;
  updatedAt: string;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function toDomainHistoryMessage(
  message: PersistedChatHistoryMessage,
): ChatHistoryMessage {
  return {
    ...message,
    timestamp: new Date(message.timestamp),
  };
}

function toPersistedHistoryMessage(
  message: ChatHistoryMessage,
): PersistedChatHistoryMessage {
  return {
    ...message,
    timestamp: message.timestamp.toISOString(),
  };
}

function toDomainHistoryItem(item: PersistedChatHistoryItem): ChatHistoryItem {
  return {
    ...item,
    messages: item.messages.map(toDomainHistoryMessage),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

function toPersistedHistoryItem(
  item: ChatHistoryItem,
): PersistedChatHistoryItem {
  return {
    ...item,
    messages: item.messages.map(toPersistedHistoryMessage),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function parseHistory(raw: string | null): ChatHistoryItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as PersistedChatHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toDomainHistoryItem);
  } catch {
    return [];
  }
}

function writeHistory(history: ChatHistoryItem[]) {
  if (!canUseStorage()) return;

  const persisted = history.map(toPersistedHistoryItem);

  try {
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(persisted));
    window.dispatchEvent(new Event(CHAT_HISTORY_UPDATED_EVENT));
    return;
  } catch {
    // If storage quota is exceeded, trim history aggressively and retry.
  }

  for (let size = Math.floor(persisted.length / 2); size >= 0; size -= 1) {
    try {
      localStorage.setItem(
        CHAT_HISTORY_STORAGE_KEY,
        JSON.stringify(persisted.slice(0, size)),
      );
      window.dispatchEvent(new Event(CHAT_HISTORY_UPDATED_EVENT));
      return;
    } catch {
      // Keep shrinking until a write succeeds or we reach zero.
    }
  }
}

export function createHistoryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getChatHistory(): ChatHistoryItem[] {
  if (!canUseStorage()) return [];

  const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
  return parseHistory(raw).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

export function getChatHistoryById(historyId: string): ChatHistoryItem | null {
  const history = getChatHistory();
  return history.find((item) => item.id === historyId) ?? null;
}

export function upsertChatHistory(item: ChatHistoryItem) {
  const current = getChatHistory().filter((history) => history.id !== item.id);
  const next = [item, ...current]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, MAX_HISTORY_ITEMS);

  writeHistory(next);
}

export function removeChatHistoryById(historyId: string) {
  const next = getChatHistory().filter((item) => item.id !== historyId);
  writeHistory(next);
}

export function clearChatHistory() {
  writeHistory([]);
}

export function onChatHistoryUpdated(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const customEventHandler = () => listener();
  const storageEventHandler = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return;
    if (event.key !== CHAT_HISTORY_STORAGE_KEY) return;
    listener();
  };

  window.addEventListener(CHAT_HISTORY_UPDATED_EVENT, customEventHandler);
  window.addEventListener("storage", storageEventHandler);

  return () => {
    window.removeEventListener(CHAT_HISTORY_UPDATED_EVENT, customEventHandler);
    window.removeEventListener("storage", storageEventHandler);
  };
}
