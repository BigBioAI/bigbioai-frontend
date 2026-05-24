import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ChatFontSize,
  ChatModel,
  ResponseStyle,
  SettingsStoreData,
  SettingsStoreState,
} from "@/types/settingsStore";

const SETTINGS_STORAGE_VERSION = 1;

const VALID_FONT_SIZES: ChatFontSize[] = ["sm", "md", "lg"];
const VALID_MODELS: ChatModel[] = [
  "bigbio-default",
  "bigbio-fast",
  "bigbio-reasoning",
];
const VALID_RESPONSE_STYLES: ResponseStyle[] = [
  "balanced",
  "concise",
  "detailed",
];

const initialSettings: SettingsStoreData = {
  chatFontSize: "md",
  model: "bigbio-default",
  responseStyle: "balanced",
};

function includesValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function sanitizeSettings(value: unknown): SettingsStoreData {
  const candidate =
    typeof value === "object" && value !== null
      ? (value as Partial<SettingsStoreData>)
      : {};

  return {
    chatFontSize: includesValue(VALID_FONT_SIZES, candidate.chatFontSize)
      ? candidate.chatFontSize
      : initialSettings.chatFontSize,
    model: includesValue(VALID_MODELS, candidate.model)
      ? candidate.model
      : initialSettings.model,
    responseStyle: includesValue(VALID_RESPONSE_STYLES, candidate.responseStyle)
      ? candidate.responseStyle
      : initialSettings.responseStyle,
  };
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set) => ({
      ...initialSettings,
      setChatFontSize: (chatFontSize) => set({ chatFontSize }),
      setModel: (model) => set({ model }),
      setResponseStyle: (responseStyle) => set({ responseStyle }),
      resetSettings: () => set(initialSettings),
    }),
    {
      name: "bigbioai_settings",
      version: SETTINGS_STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizeSettings(persistedState),
      }),
      partialize: (state) => ({
        chatFontSize: state.chatFontSize,
        model: state.model,
        responseStyle: state.responseStyle,
      }),
    },
  ),
);
