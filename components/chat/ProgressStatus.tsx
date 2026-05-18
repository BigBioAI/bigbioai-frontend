"use client";

import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ProgressDetail, ProgressStatus as ProgressStatusType } from "@/types/bioAgentStore";
import { Loader2, CheckCircle2, AlertCircle, Brain, Database, Settings2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStatusProps {
  progress: ProgressDetail;
}

const statusIcons: Record<ProgressStatusType, React.ElementType> = {
  idle: Loader2,
  downloading_data: Database,
  extracting_params: Brain,
  preprocessing: Settings2,
  ai_analyzing: Brain,
  generating_response: MessageSquare,
  complete: CheckCircle2,
  error: AlertCircle,
};

const statusMessages: Record<ProgressStatusType, string> = {
  idle: "준비 중...",
  downloading_data: "데이터 다운로드 중",
  extracting_params: "파라미터 추출 중",
  preprocessing: "전처리 실행 중",
  ai_analyzing: "AI 분석 요청 중",
  generating_response: "결과 정리 중",
  complete: "완료",
  error: "오류 발생",
};

export function ProgressStatus({ progress }: ProgressStatusProps) {
  const Icon = statusIcons[progress.status];
  const defaultMessage = statusMessages[progress.status];
  const message = progress.message || defaultMessage;

  if (progress.status === 'idle' && !progress.message) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            progress.status === 'error' ? "bg-red-100 text-red-600" :
            progress.status === 'complete' ? "bg-green-100 text-green-600" :
            "bg-primary/10 text-primary"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              progress.status !== 'error' && progress.status !== 'complete' && "animate-pulse"
            )} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{message}</p>
            {progress.substeps && progress.substeps.length > 0 && (
              <ul className="mt-2 space-y-1">
                {progress.substeps.map((step, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                    {step}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {progress.percentage !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>진행률</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}
      </div>
    </Card>
  );
}