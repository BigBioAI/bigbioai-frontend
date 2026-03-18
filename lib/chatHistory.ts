import type { LoadDatasetResponse } from "@/lib/api/dataset";

const CHAT_HISTORY_STORAGE_KEY = "bigbioai_chat_history";
const CHAT_HISTORY_UPDATED_EVENT = "chat-history-updated";
const MAX_HISTORY_ITEMS = 30;

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  figures?: string[];
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  sessionId: string;
  datasetId: string;
  datasetInfo: LoadDatasetResponse;
  messages: ChatHistoryMessage[];
  createdAt: string;
  updatedAt: string;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function parseHistory(raw: string | null): ChatHistoryItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ChatHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeHistory(history: ChatHistoryItem[]) {
  if (!canUseStorage()) return;

  localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event(CHAT_HISTORY_UPDATED_EVENT));
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
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getChatHistoryById(historyId: string): ChatHistoryItem | null {
  const history = getChatHistory();
  return history.find((item) => item.id === historyId) ?? null;
}

export function upsertChatHistory(item: ChatHistoryItem) {
  const current = getChatHistory().filter((history) => history.id !== item.id);
  const next = [item, ...current]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, MAX_HISTORY_ITEMS);

  writeHistory(next);
}

export function clearChatHistory() {
  writeHistory([]);
}

export function onChatHistoryUpdated(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => listener();
  window.addEventListener(CHAT_HISTORY_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(CHAT_HISTORY_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
