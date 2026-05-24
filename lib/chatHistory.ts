import type { LoadDatasetResponse } from "@/lib/api/dataset";

const CHAT_HISTORY_STORAGE_KEY = "bigbioai_chat_history";
const CHAT_HISTORY_UPDATED_EVENT = "chat-history-updated";
const MAX_HISTORY_ITEMS = 30;
const CHAT_HISTORY_SCHEMA_VERSION = 2;

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  figures?: string[];
  code?: string;
  isResolved?: boolean;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  sessionId: string;
  datasetId: string;
  datasetInfo: LoadDatasetResponse | null;
  messages: ChatHistoryMessage[];
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: number;
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

type UnknownRecord = Record<string, unknown>;

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
    schemaVersion: item.schemaVersion ?? CHAT_HISTORY_SCHEMA_VERSION,
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
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    // Normalize and remove null/invalid entries
    const normalized = parsed
      .map(normalizePersistedHistoryItem)
      .filter((item): item is PersistedChatHistoryItem => item !== null)
      .map((item) => {
        // Ensure createdAt/updatedAt strings are valid and normalized.
        return {
          ...item,
          createdAt: toValidDateString(item.createdAt, new Date()),
          updatedAt: toValidDateString(item.updatedAt, new Date(item.createdAt)),
        } as PersistedChatHistoryItem;
      });

    return normalized.map(toDomainHistoryItem);
  } catch {
    // If parsing fails, clear corrupted storage to avoid repeated errors
    try {
      if (canUseStorage()) localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
    return [];
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toValidDateString(value: unknown, fallback: Date) {
  if (typeof value !== "string") {
    return fallback.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

function normalizePersistedMessage(
  message: unknown,
): PersistedChatHistoryMessage | null {
  if (!isRecord(message)) return null;

  const role = message.role;
  const content = message.content;
  if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
    return null;
  }

  const timestamp = toValidDateString(message.timestamp, new Date());
  const id =
    typeof message.id === "string" && message.id.trim()
      ? message.id
      : createHistoryId();

  return {
    id,
    role,
    content,
    timestamp,
    figures: Array.isArray(message.figures)
      ? message.figures.filter((figure): figure is string => typeof figure === "string")
      : undefined,
    code: typeof message.code === "string" ? message.code : undefined,
    isResolved:
      typeof message.isResolved === "boolean" ? message.isResolved : undefined,
  };
}

function normalizePersistedHistoryItem(
  item: unknown,
): PersistedChatHistoryItem | null {
  if (!isRecord(item)) return null;

  const messages = Array.isArray(item.messages)
    ? item.messages
        .map(normalizePersistedMessage)
        .filter((message): message is PersistedChatHistoryMessage => message !== null)
    : [];

  if (messages.length === 0) return null;

  const now = new Date();
  const createdAt = toValidDateString(item.createdAt, now);
  const updatedAt = toValidDateString(item.updatedAt, new Date(createdAt));
  const datasetInfo = isRecord(item.datasetInfo)
    ? (item.datasetInfo as unknown as LoadDatasetResponse)
    : null;
  const datasetId =
    typeof item.datasetId === "string"
      ? item.datasetId
      : typeof datasetInfo?.dataset_id === "string"
        ? datasetInfo.dataset_id
        : "";

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : createHistoryId(),
    title:
      typeof item.title === "string" && item.title.trim()
        ? item.title
        : createHistoryTitle(messages),
    sessionId: typeof item.sessionId === "string" ? item.sessionId : "",
    datasetId,
    datasetInfo,
    messages,
    createdAt,
    updatedAt,
    schemaVersion:
      typeof item.schemaVersion === "number"
        ? item.schemaVersion
        : CHAT_HISTORY_SCHEMA_VERSION,
  };
}

function writeHistory(history: ChatHistoryItem[]) {
  if (!canUseStorage()) return;

  // sanitize and limit history before persisting
  const limited = history
    .filter((h) => Array.isArray(h.messages) && h.messages.length > 0)
    .slice(0, MAX_HISTORY_ITEMS);

  const persisted = limited.map(toPersistedHistoryItem);

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

export function createHistoryTitle(messages: Pick<ChatHistoryMessage, "content" | "role">[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const source = firstUserMessage?.content || messages[0]?.content || "New chat";
  const compact = source.replace(/\s+/g, " ").trim();

  if (!compact) return "New chat";
  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

export function getChatHistory(): ChatHistoryItem[] {
  if (!canUseStorage()) return [];

  const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
  return parseHistory(raw).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

export function getChatHistoryBySessionId(sessionId: string): ChatHistoryItem | null {
  if (!sessionId) return null;

  const history = getChatHistory();
  return history.find((item) => item.sessionId === sessionId) ?? null;
}

export function getChatHistoryById(historyId: string): ChatHistoryItem | null {
  const history = getChatHistory();
  return history.find((item) => item.id === historyId) ?? null;
}

export function upsertChatHistory(item: ChatHistoryItem) {
  const normalizedItem: ChatHistoryItem = {
    ...item,
    schemaVersion: CHAT_HISTORY_SCHEMA_VERSION,
    title: item.title || createHistoryTitle(item.messages),
    datasetId: item.datasetId || item.datasetInfo?.dataset_id || "",
  };
  const current = getChatHistory().filter(
    (history) =>
      history.id !== normalizedItem.id &&
      (!normalizedItem.sessionId || history.sessionId !== normalizedItem.sessionId),
  );
  const next = [normalizedItem, ...current]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, MAX_HISTORY_ITEMS);

  writeHistory(next);
}

export function saveChatHistorySnapshot(args: {
  historyId?: string | null;
  sessionId?: string | null;
  datasetInfo?: LoadDatasetResponse | null;
  messages: ChatHistoryMessage[];
}) {
  if (!args.messages.length) return null;

  const existing =
    (args.historyId ? getChatHistoryById(args.historyId) : null) ??
    (args.sessionId ? getChatHistoryBySessionId(args.sessionId) : null);
  const now = new Date();
  const historyItem: ChatHistoryItem = {
    id: existing?.id ?? args.historyId ?? createHistoryId(),
    title: existing?.title ?? createHistoryTitle(args.messages),
    sessionId: args.sessionId ?? existing?.sessionId ?? "",
    datasetId:
      args.datasetInfo?.dataset_id ?? existing?.datasetId ?? "",
    datasetInfo: args.datasetInfo ?? existing?.datasetInfo ?? null,
    messages: args.messages,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    schemaVersion: CHAT_HISTORY_SCHEMA_VERSION,
  };

  upsertChatHistory(historyItem);
  return historyItem;
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
