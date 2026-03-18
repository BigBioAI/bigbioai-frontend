"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StepForm } from "@/components/chat/StepForm";
import { Card } from "@/components/ui/card";
import {
  DatasetAPI,
  PreprocessingParams,
  LoadDatasetResponse,
} from "@/lib/api/dataset";
import { StepFormSection, StepFormData } from "@/types/stepForm";
import { toast } from "sonner";
import { Brain, Send, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { chatAPI } from "@/lib/api/chat";
import {
  createHistoryId,
  getChatHistoryById,
  upsertChatHistory,
  type ChatHistoryMessage,
} from "@/lib/chatHistory";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  figures?: string[];
}

export default function BioAgentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [extractedParams, setExtractedParams] =
    useState<PreprocessingParams | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<LoadDatasetResponse | null>(
    null,
  );
  const [googleDriveLink, setGoogleDriveLink] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<
    "upload" | "process" | "chat"
  >("upload");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const historyId = searchParams.get("history");
    if (!historyId || historyId === activeHistoryId) return;

    const history = getChatHistoryById(historyId);
    if (!history) {
      toast.error("선택한 채팅 히스토리를 찾을 수 없습니다.");
      return;
    }

    const restoredMessages = history.messages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }));

    setDatasetInfo(history.datasetInfo);
    setMessages(restoredMessages);
    setSessionId(history.sessionId);
    setCurrentPhase("chat");
    setActiveHistoryId(history.id);
    setInput("");
  }, [searchParams, activeHistoryId]);

  useEffect(() => {
    if (currentPhase !== "chat" || !datasetInfo || messages.length === 0) {
      return;
    }

    const historyId = activeHistoryId || createHistoryId();
    if (!activeHistoryId) {
      setActiveHistoryId(historyId);
    }

    const firstUserMessage = messages.find(
      (message) => message.role === "user",
    );
    const titleSource =
      firstUserMessage?.content || messages[0]?.content || "새 채팅";
    const title =
      titleSource.length > 32 ? titleSource.slice(0, 32) + "..." : titleSource;
    const now = new Date().toISOString();
    const existing = getChatHistoryById(historyId);

    const historyMessages: ChatHistoryMessage[] = messages.map((message) => ({
      ...message,
      timestamp: message.timestamp.toISOString(),
    }));

    upsertChatHistory({
      id: historyId,
      title,
      sessionId,
      datasetId: datasetInfo.dataset_id,
      datasetInfo,
      messages: historyMessages,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }, [activeHistoryId, currentPhase, datasetInfo, messages, sessionId]);

  const sections: StepFormSection[] = [
    {
      id: "data-upload",
      title: "데이터 업로드",
      description: "단세포 RNA 시퀀싱 데이터를 업로드하세요.",
      fields: [
        {
          name: "driveLink",
          label: "Google Drive 링크",
          type: "url",
          placeholder: "https://drive.google.com/file/d/xxx/view?usp=sharing",
          required: true,
          description:
            "지원: .h5, .h5ad, .zip (matrix.mtx.gz + barcodes.tsv.gz + features.tsv.gz)",
        },
      ],
      onStepComplete: async (data: StepFormData) => {
        const driveLink = data.driveLink as string;
        setGoogleDriveLink(driveLink);

        setIsLoading(true);
        try {
          const response = await DatasetAPI.loadDataset({ source: driveLink });
          setExtractedParams(response.extracted_params ?? null);
          setDatasetInfo(response);

          toast.success(`데이터 로드 완료!`, {
            description: `${response.n_cells.toLocaleString()}개 세포, ${response.n_genes.toLocaleString()}개 유전자 검출`,
          });

          setCurrentPhase("process");
          return response;
        } catch (error: any) {
          console.error("데이터 업로드 실패:", error);
          let errorMessage = "데이터 업로드에 실패했습니다.";
          if (error.message) {
            errorMessage = error.message;
          }

          const messages = errorMessage.split("\n");
          if (messages.length > 1) {
            toast.error(messages[0], {
              description: messages.slice(1).join("\n"),
              duration: 10000,
            });
          } else {
            toast.error(errorMessage);
          }

          throw error;
        } finally {
          setIsLoading(false);
        }
      },
    },
    {
      id: "preprocessing-params",
      title: "Preprocessing Parameters",
      description: "AI가 추천한 파라미터를 확인하고 조정할 수 있습니다.",
      isLocked: true,
      fields: [
        {
          name: "min_cells",
          label: "Min cells/gene",
          type: "number",
          defaultValue: extractedParams?.min_cells || 3,
          min: 1,
          max: 100,
          description: "유전자당 최소 세포 수",
        },
        {
          name: "min_genes",
          label: "Min genes/cell",
          type: "number",
          defaultValue: extractedParams?.min_genes || 200,
          min: 50,
          max: 1000,
          description: "세포당 최소 유전자 수",
        },
        {
          name: "max_genes",
          label: "Max genes/cell",
          type: "number",
          defaultValue: extractedParams?.max_genes || 2500,
          min: 1000,
          max: 20000,
          description: "Doublet 제거 임계값",
        },
        {
          name: "max_mt_pct",
          label: "Max MT %",
          type: "range",
          defaultValue: extractedParams?.max_mt_pct || 5,
          min: 0,
          max: 100,
          step: 1,
          description: "미토콘드리아 유전자 비율",
        },
        {
          name: "n_pcs",
          label: "PCA components",
          type: "number",
          defaultValue: extractedParams?.n_pcs || 40,
          min: 10,
          max: 100,
          description: "주성분 개수",
        },
        {
          name: "resolution",
          label: "Clustering resolution",
          type: "range",
          defaultValue: extractedParams?.resolution || 0.9,
          min: 0.1,
          max: 2,
          step: 0.1,
          description: "클러스터링 해상도",
        },
      ],
      onStepComplete: async (data: StepFormData) => {
        setIsLoading(true);
        try {
          const preprocessingParams: PreprocessingParams = {
            min_cells: data.min_cells as number,
            min_genes: data.min_genes as number,
            max_genes: data.max_genes as number,
            max_mt_pct: data.max_mt_pct as number,
            n_pcs: data.n_pcs as number,
            resolution: data.resolution as number,
            target_sum: extractedParams?.target_sum || 10000,
            n_neighbors: extractedParams?.n_neighbors || 10,
            min_mean: extractedParams?.min_mean || 0.0125,
            max_mean: extractedParams?.max_mean || 3,
            min_disp: extractedParams?.min_disp || 0.5,
            scale_max_value: extractedParams?.scale_max_value || 10,
            pca_svd_solver: extractedParams?.pca_svd_solver || "arpack",
          };

          const response = await DatasetAPI.loadDataset({
            source: googleDriveLink,
            preprocessing: preprocessingParams,
          });
          setDatasetInfo(response);

          toast.success("전처리 완료! AI 분석을 시작할 수 있습니다.");

          setMessages([
            {
              id: "1",
              role: "assistant",
              content: `데이터 전처리가 완료되었습니다! ${response.n_cells.toLocaleString()}개 세포와 ${response.n_genes.toLocaleString()}개 유전자가 검출되었습니다. 어떤 분석을 시작하시겠어요?`,
              timestamp: new Date(),
            },
          ]);

          setSessionId("");
          setActiveHistoryId(createHistoryId());
          setCurrentPhase("chat");
          return response;
        } catch (error) {
          console.error("전처리 실패:", error);
          toast.error("데이터 전처리에 실패했습니다.");
          throw error;
        } finally {
          setIsLoading(false);
        }
      },
    },
  ];

  if (extractedParams && sections[1].fields) {
    sections[1].fields = sections[1].fields.map((field) => {
      const paramKey = field.name as keyof PreprocessingParams;
      if (extractedParams[paramKey] !== undefined) {
        return { ...field, defaultValue: extractedParams[paramKey] };
      }
      return field;
    });
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !datasetInfo || isChatLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsChatLoading(true);

    try {
      let chatResponse;

      if (sessionId) {
        chatResponse = await chatAPI.continueConversation(
          currentInput,
          datasetInfo.dataset_id,
          sessionId,
        );
      } else {
        chatResponse = await chatAPI.startNewConversation(
          currentInput,
          datasetInfo.dataset_id,
        );
        setSessionId(chatResponse.session_id);
      }

      const filterRelevantFigures = (figures: string[], userQuery: string) => {
        if (!figures || figures.length === 0) return figures;

        const query = userQuery.toLowerCase();
        const filtered = figures.filter((url) => {
          const fileName = url.split("/").pop()?.toLowerCase() || "";

          if (query.includes("tsne") || query.includes("t-sne")) {
            return fileName.includes("tsne");
          }
          if (query.includes("umap")) {
            return fileName.includes("umap");
          }
          if (query.includes("히트맵") || query.includes("heatmap")) {
            return fileName.includes("heatmap");
          }
          if (query.includes("pca")) {
            return fileName.includes("pca");
          }
          if (query.includes("바이올린") || query.includes("violin")) {
            return fileName.includes("violin");
          }

          return true;
        });

        return filtered.length > 0 ? filtered : figures.slice(-2);
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: chatResponse.answer,
        timestamp: new Date(),
        figures: chatResponse.figures
          ? filterRelevantFigures(chatResponse.figures, currentInput)
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);

      let errorText =
        "죄송합니다. 응답 중 오류가 발생했습니다. 다시 시도해주세요.";

      if (error.message && typeof error.message === "string") {
        errorText = error.message;
      } else if (error.response?.data?.error) {
        errorText = error.response.data.error;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      toast.error("채팅 중 오류가 발생했습니다.");
    } finally {
      setIsChatLoading(false);
    }
  };

  if (currentPhase === "upload" || currentPhase === "process") {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-black">BigBioAI</h1>
            <p className="text-muted-foreground mt-2">
              단세포 RNA 시퀀싱 데이터 분석 플랫폼
            </p>
          </div>

          <Card className="p-6">
            <StepForm sections={sections} />
          </Card>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-96 p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Brain className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <p className="text-lg font-medium">
                  AI가 데이터를 분석 중입니다
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  최적의 파라미터를 찾고 있습니다...
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (currentPhase === "chat" && datasetInfo) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">BigBioAI</h1>
            <span className="text-sm text-muted-foreground">
              Dataset: {datasetInfo.n_cells.toLocaleString()} cells,{" "}
              {datasetInfo.n_genes.toLocaleString()} genes
            </span>
          </div>
          <button
            onClick={() => {
              setCurrentPhase("upload");
              setDatasetInfo(null);
              setExtractedParams(null);
              setMessages([]);
              setSessionId("");
              setActiveHistoryId("");
              router.replace("/bio-agent");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            새 세션
          </button>
        </div>

        <ScrollArea className="flex-1 p-4 pb-20">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Brain className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.figures && message.figures.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.figures.map((figureUrl, index) => {
                        const fullImageUrl = figureUrl.startsWith("/")
                          ? `http://localhost:8001${figureUrl}`
                          : figureUrl;

                        return (
                          <div
                            key={index}
                            className="border rounded-lg overflow-hidden bg-white"
                          >
                            <img
                              src={fullImageUrl}
                              alt={`Analysis figure ${index + 1}`}
                              className="w-full h-auto"
                              onLoad={() =>
                                console.log(
                                  "Image loaded successfully:",
                                  fullImageUrl,
                                )
                              }
                              onError={(e) => {
                                console.error(
                                  "Failed to load image:",
                                  fullImageUrl,
                                );
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Brain className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI가 분석 중입니다...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky bottom-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="메시지를 입력하세요..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isChatLoading}
                size="icon"
              >
                {isChatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
