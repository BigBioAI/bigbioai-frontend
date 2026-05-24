"use client";

import { StepForm } from "@/components/chat/StepForm";
import { Card } from "@/components/ui/card";
import { DatasetAPI, PreprocessingParams } from "@/lib/api/dataset";
import { StepFormSection, StepFormData } from "@/types/stepForm";
import { toast } from "sonner";
import { Brain, Send, User, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { chatAPI } from "@/lib/api/chat";
import { useBioAgentStore } from "@/store/bioAgentStore";
import { useSettingsStore } from "@/store/settingsStore";
import { BioAgentMessage } from "@/types/chat";
import {
  getChatHistoryById,
  saveChatHistorySnapshot,
} from "@/lib/chatHistory";
import { useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SecureImage } from "@/components/chat/SecureImage";
import { cn } from "@/lib/utils";

export default function BioAgentPage() {
  const FIGURE_API_BASE_URL =
    process.env.NEXT_PUBLIC_FIGURE_BASE_URL?.replace(/\/$/, "") ?? "";
  const searchParams = useSearchParams();
  const restoredHistoryIdRef = useRef<string | null>(null);
  const activeHistoryIdRef = useRef<string | null>(null);

  const {
    isLoading,
    extractedParams,
    datasetInfo,
    currentPhase,
    messages,
    input,
    sessionId,
    isChatLoading,
    patch,
    replaceMessages,
    appendMessage,
    resetWorkflow,
  } = useBioAgentStore();
  const { chatFontSize, model, responseStyle } = useSettingsStore();

  const chatTextSizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[chatFontSize];

  useEffect(() => {
    const historyId = searchParams.get("history");
    if (!historyId) {
      restoredHistoryIdRef.current = null;
      activeHistoryIdRef.current = null;
      return;
    }

    if (restoredHistoryIdRef.current === historyId) {
      return;
    }

    const historyItem = getChatHistoryById(historyId);
    if (!historyItem) {
      toast.error("선택한 대화 기록을 찾을 수 없습니다.");
      restoredHistoryIdRef.current = historyId;
      return;
    }

    if (!historyItem.datasetInfo) {
      toast.error("데이터셋 정보가 없는 대화 기록은 복원할 수 없습니다.");
      restoredHistoryIdRef.current = historyId;
      return;
    }

    patch({
      extractedParams: historyItem.datasetInfo.extracted_params ?? null,
      datasetInfo: historyItem.datasetInfo,
      currentPhase: "chat",
      messages: historyItem.messages,
      sessionId: historyItem.sessionId,
      input: "",
      isLoading: false,
      isChatLoading: false,
    });

    restoredHistoryIdRef.current = historyId;
    activeHistoryIdRef.current = historyItem.id;
  }, [patch, searchParams]);

  const sections: StepFormSection[] = useMemo(() => {
    console.log("Sections 재계산 - extractedParams:", extractedParams);
    return [
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
        patch({ googleDriveLink: driveLink, isLoading: true });
        try {
          // Step 1: Preview - 데이터 다운로드 및 파라미터 추출
          const previewResponse = await DatasetAPI.previewDataset(driveLink);
          console.log("Preview 응답:", previewResponse);
          console.log("추출된 파라미터:", previewResponse.extracted_params);

          patch({
            extractedParams: previewResponse.extracted_params ?? null,
            rawId: previewResponse.raw_id,
          });

          toast.success(`데이터 분석 완료!`, {
            description: `최적 파라미터를 자동으로 추출했습니다.`,
          });

          patch({ currentPhase: "process" });
          return previewResponse;
        } catch (error: unknown) {
          console.error("데이터 업로드 실패:", error);
          const errorMessage = getErrorMessage(
            error,
            "데이터 업로드에 실패했습니다.",
          );

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
          patch({ isLoading: false });
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
          defaultValue: (() => {
            const value = extractedParams?.min_cells ?? 3;
            console.log("min_cells defaultValue:", value, "extractedParams?.min_cells:", extractedParams?.min_cells);
            return value;
          })(),
          min: 1,
          max: 100,
          description: "유전자당 최소 세포 수",
        },
        {
          name: "min_genes",
          label: "Min genes/cell",
          type: "number",
          defaultValue: (() => {
            const value = extractedParams?.min_genes ?? 200;
            console.log("min_genes defaultValue:", value, "extractedParams?.min_genes:", extractedParams?.min_genes);
            return value;
          })(),
          min: 50,
          max: 1000,
          description: "세포당 최소 유전자 수",
        },
        {
          name: "max_genes",
          label: "Max genes/cell",
          type: "number",
          defaultValue: extractedParams?.max_genes ?? 2500,
          min: 1000,
          max: 20000,
          description: "Doublet 제거 임계값",
        },
        {
          name: "max_mt_pct",
          label: "Max MT %",
          type: "range",
          defaultValue: extractedParams?.max_mt_pct ?? 5,
          min: 0,
          max: 100,
          step: 1,
          description: "미토콘드리아 유전자 비율",
        },
        {
          name: "n_pcs",
          label: "PCA components",
          type: "number",
          defaultValue: extractedParams?.n_pcs ?? 40,
          min: 10,
          max: 100,
          description: "주성분 개수",
        },
        {
          name: "resolution",
          label: "Clustering resolution",
          type: "range",
          defaultValue: extractedParams?.resolution ?? 0.9,
          min: 0.1,
          max: 2,
          step: 0.1,
          description: "클러스터링 해상도",
        },
      ],
      onStepComplete: async (data: StepFormData) => {
        patch({ isLoading: true });
        try {
          const rawId = useBioAgentStore.getState().rawId;

          if (!rawId) {
            throw new Error("데이터 업로드를 먼저 완료해주세요.");
          }

          const preprocessingParams: PreprocessingParams = {
            min_cells: data.min_cells as number,
            min_genes: data.min_genes as number,
            max_genes: data.max_genes as number,
            max_mt_pct: data.max_mt_pct as number,
            n_pcs: data.n_pcs as number,
            resolution: data.resolution as number,
            target_sum: extractedParams?.target_sum ?? 10000,
            n_neighbors: extractedParams?.n_neighbors ?? 10,
            min_mean: extractedParams?.min_mean ?? 0.0125,
            max_mean: extractedParams?.max_mean ?? 3,
            min_disp: extractedParams?.min_disp ?? 0.5,
            scale_max_value: extractedParams?.scale_max_value ?? 10,
            pca_svd_solver: extractedParams?.pca_svd_solver ?? "arpack",
          };

          // Step 2: Confirm - 추출된 파라미터로 전처리 수행
          const response = await DatasetAPI.confirmDataset({
            raw_id: rawId,
            preprocessing: preprocessingParams,
          });
          console.log("전처리 응답:", response);
          console.log("전처리 후 dataset_id:", response.dataset_id);

          patch({ datasetInfo: response });

          toast.success("전처리 완료! AI 분석을 시작할 수 있습니다.");

          // 초기 메시지 추가
          const initialMessages: BioAgentMessage[] = [
            {
              id: "1",
              role: "assistant",
              content: `데이터 전처리가 완료되었습니다! ${response.n_cells.toLocaleString()}개 세포와 ${response.n_genes.toLocaleString()}개 유전자가 검출되었습니다. 어떤 분석을 시작하시겠어요?`,
              timestamp: new Date(),
            },
          ];
          replaceMessages(initialMessages);

          // 세션 초기화
          patch({
            sessionId: "",
            currentPhase: "chat",
          });
          const savedHistory = saveChatHistorySnapshot({
            historyId: activeHistoryIdRef.current,
            sessionId: "",
            datasetInfo: response,
            messages: initialMessages,
          });
          activeHistoryIdRef.current = savedHistory?.id ?? null;
          return response;
        } catch (error) {
          console.error("전처리 실패:", error);
          toast.error("데이터 전처리에 실패했습니다.");
          throw error;
        } finally {
          patch({ isLoading: false });
        }
      },
    },
  ];
  }, [extractedParams, patch, replaceMessages]); // extractedParams 변경 시 재계산

  function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    const errorWithResponse = error as {
      response?: {
        data?: {
          error?: string;
        };
      };
    };

    if (typeof errorWithResponse.response?.data?.error === "string") {
      return errorWithResponse.response.data.error;
    }

    return fallback;
  }

  function resolveFigureUrl(figureUrl: string): string {
    // Handle CDN URLs - convert to local proxy
    if (figureUrl.includes("cdn.bigbioai.com")) {
      // Extract session and path from CDN URL
      // https://cdn.bigbioai.com/sessions/session_171068b746ac/plots/embedding_cluster.png
      const cdnMatch = figureUrl.match(/\/sessions\/(session_[0-9a-f]{12})\/plots\/(.+)$/);
      if (cdnMatch) {
        const [, sessionId, plotPath] = cdnMatch;
        const proxyUrl = `/api/artifacts/sessions/${sessionId}/plots/${plotPath}`;
        console.log("CDN URL 변환:", figureUrl, "→", proxyUrl);
        return proxyUrl;
      }
    }

    // Handle existing HTTP/HTTPS URLs
    if (/^https?:\/\//i.test(figureUrl)) {
      return figureUrl;
    }

    // Handle /api/artifacts/ URLs - they're already correct for our proxy
    if (figureUrl.startsWith("/api/artifacts/")) {
      return figureUrl;
    }

    // Legacy support for FIGURE_API_BASE_URL
    if (figureUrl.startsWith("/") && FIGURE_API_BASE_URL) {
      return `${FIGURE_API_BASE_URL}${figureUrl}`;
    }

    return figureUrl;
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !datasetInfo || !datasetInfo.dataset_id || isChatLoading) {
      if (!datasetInfo) {
        toast.error("데이터셋 정보가 없습니다. 데이터 업로드를 먼저 완료해주세요.");
      } else if (!datasetInfo.dataset_id) {
        console.error("datasetInfo 상태:", datasetInfo);
        toast.error("데이터셋 ID가 없습니다. 데이터 전처리가 완료되었는지 확인해주세요.");
      }
      return;
    }
    console.log("채팅 시작 - dataset_id:", datasetInfo.dataset_id);

    const userMessage: BioAgentMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    appendMessage(userMessage);
    const currentInput = input.trim();
    const messagesWithUser = [...messages, userMessage];
    patch({ input: "", isChatLoading: true });

    try {
      let chatResponse;

      if (sessionId) {
        chatResponse = await chatAPI.continueConversation(
          currentInput,
          datasetInfo.dataset_id,
          sessionId,
          {
            model,
            responseStyle,
          },
        );
      } else {
        chatResponse = await chatAPI.startNewConversation(
          currentInput,
          datasetInfo.dataset_id,
          {
            model,
            responseStyle,
          },
        );
        patch({ sessionId: chatResponse.session_id });
      }
      const nextSessionId = chatResponse.session_id || sessionId;

      const filterRelevantFigures = (figures: string[], userQuery: string) => {
        if (!figures || figures.length === 0) return figures;

        const query = userQuery.toLowerCase();
        let keyword: "tsne" | "umap" | "heatmap" | "pca" | "violin" | null =
          null;

        if (query.includes("tsne") || query.includes("t-sne")) {
          keyword = "tsne";
        } else if (query.includes("umap")) {
          keyword = "umap";
        } else if (query.includes("히트맵") || query.includes("heatmap")) {
          keyword = "heatmap";
        } else if (query.includes("pca")) {
          keyword = "pca";
        } else if (query.includes("바이올린") || query.includes("violin")) {
          keyword = "violin";
        }

        if (!keyword) {
          return figures.slice(-2);
        }

        const filtered = figures.filter((url) => {
          const fileName = url.split("/").pop()?.toLowerCase() || "";

          if (keyword === "tsne") {
            return fileName.includes("tsne");
          }
          if (keyword === "umap") {
            return fileName.includes("umap");
          }
          if (keyword === "heatmap") {
            return fileName.includes("heatmap");
          }
          if (keyword === "pca") {
            return fileName.includes("pca");
          }
          if (keyword === "violin") {
            return fileName.includes("violin");
          }

          return false;
        });

        return filtered.length > 0 ? filtered : figures.slice(-2);
      };

      // Markdown 이미지 링크 추출
      const extractMarkdownImages = (text: string): string[] => {
        const markdownImageRegex = /!\[.*?\]\(([^)]+)\)/g;
        const images: string[] = [];
        let match;
        while ((match = markdownImageRegex.exec(text)) !== null) {
          images.push(match[1]);
        }
        return images;
      };

      const markdownImages = extractMarkdownImages(chatResponse.answer);
      const allFigures = [
        ...(chatResponse.figures || []),
        ...markdownImages
      ];

      const assistantMessage: BioAgentMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: chatResponse.answer,
        timestamp: new Date(),
        figures: allFigures.length > 0
          ? filterRelevantFigures(allFigures, currentInput)
          : undefined,
        code: chatResponse.code,
      };

      appendMessage(assistantMessage);
      const savedHistory = saveChatHistorySnapshot({
        historyId: activeHistoryIdRef.current,
        sessionId: nextSessionId,
        datasetInfo,
        messages: [...messagesWithUser, assistantMessage],
      });
      activeHistoryIdRef.current = savedHistory?.id ?? null;
    } catch (error: unknown) {
      console.error("Chat error:", error);
      const errorText = getErrorMessage(
        error,
        "죄송합니다. 응답 중 오류가 발생했습니다. 다시 시도해주세요.",
      );

      const errorMessage: BioAgentMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
        timestamp: new Date(),
      };

      appendMessage(errorMessage);
      const savedHistory = saveChatHistorySnapshot({
        historyId: activeHistoryIdRef.current,
        sessionId,
        datasetInfo,
        messages: [...messagesWithUser, errorMessage],
      });
      activeHistoryIdRef.current = savedHistory?.id ?? null;
      toast.error("채팅 중 오류가 발생했습니다.");
    } finally {
      patch({ isChatLoading: false });
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
            <span className="text-xs text-muted-foreground">
              {model.replace("bigbio-", "BigBio ")} · {responseStyle}
            </span>
          </div>
          <button
            onClick={() => {
              activeHistoryIdRef.current = null;
              restoredHistoryIdRef.current = null;
              resetWorkflow();
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
                  className={`max-w-[70%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-lg px-4 py-2"
                      : ""
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <p className={cn("whitespace-pre-wrap", chatTextSizeClass)}>
                          {message.content}
                        </p>
                        {message.code && (
                          <div className="mt-3 p-3 bg-gray-900 rounded-md overflow-x-auto">
                            <pre className="text-sm text-gray-100">
                              <code>{message.code.replace(/```python\n?/, '').replace(/```$/, '')}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                      {/* 승인이 필요한 메시지인 경우 버튼 표시 */}
                      {(message.content.includes("현재 매개변수를 유지하시겠습니까") ||
                        message.content.includes("승인이 필요합니다") ||
                        message.content.includes("어떻게 진행하시기를 원하시는지") ||
                        message.content.includes("생성된 코드를 검토하고 실행을 승인해주세요") ||
                        message.content.includes("승인해주세요")) &&
                        !message.isResolved && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={async () => {
                              // 현재 상태를 다시 가져오기
                              const currentState = useBioAgentStore.getState();
                              console.log("=== 승인 클릭 디버깅 ===");
                              console.log("1. sessionId prop:", sessionId);
                              console.log("2. Store sessionId:", currentState.sessionId);
                              console.log("3. 전체 Store 상태:", currentState);
                              console.log("4. 현재 메시지:", message);

                              // sessionId가 없으면 Store에서 다시 가져오기
                              const effectiveSessionId = sessionId || currentState.sessionId;

                              console.log("5. 최종 effectiveSessionId:", effectiveSessionId);
                              console.log("6. typeof effectiveSessionId:", typeof effectiveSessionId);

                              if (!effectiveSessionId) {
                                console.error("sessionId를 찾을 수 없음");
                                toast.error("세션 ID를 찾을 수 없습니다. 채팅을 다시 시작해주세요.");
                                return;
                              }

                              try {
                                patch({ isChatLoading: true });
                                await chatAPI.resumeSession(effectiveSessionId, true);

                                // 메시지를 resolved로 마킹
                                const updatedMessages = messages.map(msg =>
                                  msg.id === message.id ? { ...msg, isResolved: true } : msg
                                );
                                replaceMessages(updatedMessages);

                                // 승인 성공 메시지 추가
                                const approvalMessage: BioAgentMessage = {
                                  id: Date.now().toString(),
                                  role: "assistant",
                                  content: "✅ 코드 실행이 승인되었습니다. 분석을 진행합니다...",
                                  timestamp: new Date(),
                                };
                                appendMessage(approvalMessage);
                                const savedHistory = saveChatHistorySnapshot({
                                  historyId: activeHistoryIdRef.current,
                                  sessionId: effectiveSessionId,
                                  datasetInfo,
                                  messages: [...updatedMessages, approvalMessage],
                                });
                                activeHistoryIdRef.current = savedHistory?.id ?? null;

                                toast.success("승인되었습니다. 분석을 계속합니다.");
                              } catch (error) {
                                console.error("Resume error:", error);
                                toast.error("승인 처리 중 오류가 발생했습니다.");
                              } finally {
                                patch({ isChatLoading: false });
                              }
                            }}
                            disabled={isChatLoading}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const feedback = prompt("변경하고 싶은 파라미터를 입력해주세요:");
                              if (feedback === null) return; // 취소 클릭

                              // 현재 상태를 다시 가져오기
                              const currentState = useBioAgentStore.getState();
                              console.log("거절 클릭 - sessionId:", sessionId);
                              console.log("현재 상태:", { sessionId, datasetInfo, currentPhase });
                              console.log("Store 상태:", currentState.sessionId);

                              // sessionId가 없으면 Store에서 다시 가져오기
                              const effectiveSessionId = sessionId || currentState.sessionId;

                              console.log("최종 effectiveSessionId (거절):", effectiveSessionId);

                              if (!effectiveSessionId) {
                                console.error("sessionId를 찾을 수 없음");
                                toast.error("세션 ID를 찾을 수 없습니다. 채팅을 다시 시작해주세요.");
                                return;
                              }
                              try {
                                patch({ isChatLoading: true });
                                await chatAPI.resumeSession(effectiveSessionId, false, feedback || "파라미터를 조정해주세요");

                                // 메시지를 resolved로 마킹
                                const updatedMessages = messages.map(msg =>
                                  msg.id === message.id ? { ...msg, isResolved: true } : msg
                                );
                                replaceMessages(updatedMessages);

                                // 거절 메시지 추가
                                const rejectionMessage: BioAgentMessage = {
                                  id: Date.now().toString(),
                                  role: "assistant",
                                  content: `❌ 코드 실행이 거절되었습니다.\n피드백: ${feedback || "파라미터를 조정해주세요"}\n\n새로운 접근 방법을 시도합니다...`,
                                  timestamp: new Date(),
                                };
                                appendMessage(rejectionMessage);
                                const savedHistory = saveChatHistorySnapshot({
                                  historyId: activeHistoryIdRef.current,
                                  sessionId: effectiveSessionId,
                                  datasetInfo,
                                  messages: [...updatedMessages, rejectionMessage],
                                });
                                activeHistoryIdRef.current = savedHistory?.id ?? null;

                                toast.success("거절되었습니다. 파라미터를 재조정합니다.");
                              } catch (error) {
                                console.error("Resume error:", error);
                                toast.error("거절 처리 중 오류가 발생했습니다.");
                              } finally {
                                patch({ isChatLoading: false });
                              }
                            }}
                            disabled={isChatLoading}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            거절
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className={cn("whitespace-pre-wrap", chatTextSizeClass)}>
                      {message.content}
                    </p>
                  )}
                  {message.figures && message.figures.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.figures.map((figureUrl, index) => {
                        // .npz 파일은 이미지가 아니므로 제외
                        if (figureUrl.endsWith('.npz')) {
                          return null;
                        }

                        const fullImageUrl = resolveFigureUrl(figureUrl);

                        return (
                          <div
                            key={index}
                            className="border rounded-lg overflow-hidden bg-white"
                          >
                            <div className="p-2 text-xs text-gray-500">
                              디버그: {fullImageUrl}
                            </div>
                            <SecureImage
                              src={fullImageUrl}
                              alt={`Analysis figure ${index + 1}`}
                              className="w-full h-auto"
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
                    <div className="flex flex-col">
                      <span>AI가 분석 중입니다...</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        복잡한 분석은 최대 5분까지 소요될 수 있습니다
                      </span>
                    </div>
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
                onChange={(e) => patch({ input: e.target.value })}
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
