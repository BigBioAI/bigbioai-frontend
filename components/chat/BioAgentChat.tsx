'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import { useBioAgentChatStore } from '@/store/bioAgentChatStore';

interface BioAgentChatProps {
  onSubmit?: (text: string) => void;
  onDataClick?: () => void;
}

export function BioAgentChat({ onSubmit, onDataClick }: BioAgentChatProps) {
  const { input, patch, resetInput } = useBioAgentChatStore();

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit?.(input);
      resetInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">BigBioAI</h1>
          <p className="text-lg text-muted-foreground">What data or task are you starting with?</p>
        </div>
      </div>

      {/* Chat Area - will expand when messages exist */}
      <div className="flex-1 overflow-auto px-4">
        {/* Messages will be displayed here */}
      </div>

      {/* Input Area */}
      <div className="p-4 max-w-3xl mx-auto w-full">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => patch({ input: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you'd like to work on..."
            className="min-h-[120px] pr-20 resize-none text-base"
          />

          {/* File Attachment Button */}
          <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDataClick}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Data
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="absolute right-3 bottom-3"
            size="sm"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}