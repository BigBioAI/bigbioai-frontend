"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/settingsStore";
import type {
  ChatFontSize,
  ChatModel,
  ResponseStyle,
} from "@/types/settingsStore";

export function ChatSettingsPanel() {
  const {
    chatFontSize,
    model,
    responseStyle,
    setChatFontSize,
    setModel,
    setResponseStyle,
    resetSettings,
  } = useSettingsStore();

  return (
    <div className="space-y-6 px-4 pb-4">
      <div className="space-y-2">
        <Label htmlFor="chat-font-size">글자 크기</Label>
        <Select
          value={chatFontSize}
          onValueChange={(value) => setChatFontSize(value as ChatFontSize)}
        >
          <SelectTrigger id="chat-font-size" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">작게</SelectItem>
            <SelectItem value="md">보통</SelectItem>
            <SelectItem value="lg">크게</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chat-model">모델</Label>
        <Select
          value={model}
          onValueChange={(value) => setModel(value as ChatModel)}
        >
          <SelectTrigger id="chat-model" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bigbio-default">BigBio Default</SelectItem>
            <SelectItem value="bigbio-fast">BigBio Fast</SelectItem>
            <SelectItem value="bigbio-reasoning">BigBio Reasoning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="response-style">응답 스타일</Label>
        <Select
          value={responseStyle}
          onValueChange={(value) => setResponseStyle(value as ResponseStyle)}
        >
          <SelectTrigger id="response-style" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balanced">균형</SelectItem>
            <SelectItem value="concise">간결</SelectItem>
            <SelectItem value="detailed">자세히</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={resetSettings}
      >
        <RotateCcw className="size-4" />
        기본값으로 초기화
      </Button>
    </div>
  );
}
