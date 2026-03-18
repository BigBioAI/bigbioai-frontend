'use client';

import { useRef, useEffect } from 'react';
import { Message, AnalysisRequest } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Brain,
  User,
  Loader2,
  BarChart3,
  GitBranch,
  Microscope,
  Dna
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatInterfaceStore } from '@/store/chatInterfaceStore';

interface ChatInterfaceProps {
  datasetId: string;
  initialMessage?: string;
}

export function ChatInterface({ datasetId, initialMessage }: ChatInterfaceProps) {
  const {
    messages,
    input,
    isLoading,
    initializeChat,
    patch,
    appendMessage,
    removeMessageById,
  } = useChatInterfaceStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeChat(datasetId, initialMessage);
  }, [datasetId, initialMessage, initializeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      metadata: { datasetId }
    };

    appendMessage(userMessage);
    patch({ input: '', isLoading: true });

    const loadingMessageId = `${Date.now()}_loading`;
    const loadingMessage: Message = {
      id: loadingMessageId,
      role: 'assistant',
      content: 'AI가 분석 중입니다...',
      timestamp: new Date(),
      metadata: { loading: true }
    };

    appendMessage(loadingMessage);

    try {
      const request: AnalysisRequest = {
        message: userMessage.content,
        datasetId,
      };

      const response = await fetch('/api/chat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: request.message,
          dataset_id: request.datasetId,
          analysis_type: request.analysisType,
          parameters: request.parameters,
        }),
      });

      if (!response.ok) {
        throw new Error('분석 요청 실패');
      }

      const data = await response.json();

      removeMessageById(loadingMessageId);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          datasetId,
          analysisType: data.results?.type
        }
      };

      appendMessage(assistantMessage);
    } catch {
      removeMessageById(loadingMessageId);

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '죄송합니다. 분석 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
        metadata: { error: true }
      };

      appendMessage(errorMessage);
    } finally {
      patch({ isLoading: false });
      inputRef.current?.focus();
    }
  };

  const quickActions = [
    { icon: BarChart3, label: '클러스터링 분석', query: '클러스터링 분석을 수행해줘' },
    { icon: GitBranch, label: '차별 발현 유전자', query: '클러스터별 차별 발현 유전자를 찾아줘' },
    { icon: Microscope, label: '세포 타입 예측', query: '세포 타입을 예측해줘' },
    { icon: Dna, label: '경로 분석', query: '유전자 경로 분석을 수행해줘' },
  ];

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <Card className={cn(
                "p-3 max-w-[80%]",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted',
                message.metadata?.error && 'border-destructive'
              )}>
                {message.metadata?.loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{message.content}</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </Card>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="p-4 border-t">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">빠른 분석 시작</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    patch({ input: action.query });
                    inputRef.current?.focus();
                  }}
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => patch({ input: e.target.value })}
              placeholder="분석하고 싶은 내용을 입력하세요..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}