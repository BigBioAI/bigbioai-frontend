export type ChatFontSize = "sm" | "md" | "lg";

export type ChatModel = "bigbio-default" | "bigbio-fast" | "bigbio-reasoning";

export type ResponseStyle = "balanced" | "concise" | "detailed";

export interface SettingsStoreData {
  chatFontSize: ChatFontSize;
  model: ChatModel;
  responseStyle: ResponseStyle;
}

export interface SettingsStoreState extends SettingsStoreData {
  setChatFontSize: (chatFontSize: ChatFontSize) => void;
  setModel: (model: ChatModel) => void;
  setResponseStyle: (responseStyle: ResponseStyle) => void;
  resetSettings: () => void;
}
