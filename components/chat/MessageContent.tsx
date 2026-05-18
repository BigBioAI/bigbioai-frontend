"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface MessageContentProps {
  content: string;
  code?: string;
  className?: string;
}

interface ParsedContent {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function parseContent(content: string): ParsedContent[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const inlineCodeRegex = /`([^`]+)`/g;
  const parts: ParsedContent[] = [];
  let lastIndex = 0;
  let match;

  const tempMarkers: Array<{ start: number; end: number; type: 'block' | 'inline'; language?: string; content: string }> = [];

  // 먼저 코드 블록 찾기
  while ((match = codeBlockRegex.exec(content)) !== null) {
    tempMarkers.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'block',
      language: match[1] || 'plaintext',
      content: match[2].trim()
    });
  }

  // 인라인 코드 찾기 (코드 블록 내부가 아닌 경우만)
  while ((match = inlineCodeRegex.exec(content)) !== null) {
    const isInsideBlock = tempMarkers.some(
      marker => marker.type === 'block' && match.index >= marker.start && match.index < marker.end
    );
    if (!isInsideBlock) {
      tempMarkers.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'inline',
        content: match[1]
      });
    }
  }

  // 시작 위치 기준으로 정렬
  tempMarkers.sort((a, b) => a.start - b.start);

  // 파싱된 컨텐츠 생성
  for (const marker of tempMarkers) {
    // 마커 이전의 텍스트 추가
    if (lastIndex < marker.start) {
      const text = content.substring(lastIndex, marker.start);
      if (text.trim()) {
        parts.push({ type: 'text', content: text });
      }
    }

    // 마커 컨텐츠 추가
    if (marker.type === 'block') {
      parts.push({
        type: 'code',
        content: marker.content,
        language: marker.language
      });
    } else {
      // 인라인 코드는 텍스트로 처리하되 스타일링을 위해 백틱 유지
      parts.push({
        type: 'text',
        content: `\`${marker.content}\``
      });
    }

    lastIndex = marker.end;
  }

  // 마지막 남은 텍스트 추가
  if (lastIndex < content.length) {
    const text = content.substring(lastIndex);
    if (text.trim()) {
      parts.push({ type: 'text', content: text });
    }
  }

  // 파싱된 부분이 없으면 전체를 텍스트로
  if (parts.length === 0 && content.trim()) {
    parts.push({ type: 'text', content });
  }

  return parts;
}

function CodeBlock({ content, language = 'plaintext' }: { content: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      python: 'Python',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      json: 'JSON',
      bash: 'Bash',
      shell: 'Shell',
      sql: 'SQL',
      r: 'R',
      plaintext: 'Text'
    };
    return labels[lang.toLowerCase()] || lang.toUpperCase();
  };

  return (
    <div className="relative group my-3">
      <div className="absolute top-0 right-0 flex items-center gap-2 p-2">
        <span className="text-xs text-gray-400 font-mono">
          {getLanguageLabel(language)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-300"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className={cn(
        "bg-gray-900 text-gray-100 rounded-lg p-4 pt-10 overflow-x-auto",
        "text-sm font-mono leading-relaxed"
      )}>
        <code className={`language-${language}`}>
          {content}
        </code>
      </pre>
    </div>
  );
}

function TextContent({ content }: { content: string }) {
  // 인라인 코드를 위한 스타일 처리
  const renderTextWithInlineCode = (text: string) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-sm font-mono rounded"
          >
            {code}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // 줄바꿈 처리
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, index) => (
        <React.Fragment key={index}>
          {index > 0 && <br />}
          {renderTextWithInlineCode(line)}
        </React.Fragment>
      ))}
    </>
  );
}

export function MessageContent({ content, code, className }: MessageContentProps) {
  // code prop이 있으면 기존 방식대로 처리
  if (code) {
    const cleanCode = code.replace(/```python\n?/, '').replace(/```$/, '');
    return (
      <div className={className}>
        <p className="whitespace-pre-wrap">{content}</p>
        <CodeBlock content={cleanCode} language="python" />
      </div>
    );
  }

  // content를 파싱하여 코드 블록과 텍스트 분리
  const parsedContent = parseContent(content);

  return (
    <div className={className}>
      {parsedContent.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={index}
              content={part.content}
              language={part.language}
            />
          );
        }
        return (
          <div key={index} className="whitespace-pre-wrap">
            <TextContent content={part.content} />
          </div>
        );
      })}
    </div>
  );
}