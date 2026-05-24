import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { authAPI } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";
import type { ChatModel, ResponseStyle } from "@/types/settingsStore";

export interface ChatRequest {
  query: string;
  dataset_id: string;
  session_id?: string;
  model?: ChatModel;
  response_style?: ResponseStyle;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  figures?: string[];
  error?: string;
  code?: string;
}

export interface ChatError {
  error: string;
  code?: string;
  hint?: string;
}

export interface ResumeSessionRequest {
  approved: boolean;
  feedback?: string;
}

export interface ResumeSessionResponse {
  session_id: string;
  status: string;
  message?: string;
}

type ApiErrorPayload = {
  error?: string | { code?: string; message?: string };
  detail?: string;
  message?: string;
  hint?: string;
  code?: string;
};

class ChatAPI {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: "", // Using Next.js API routes
      timeout: 300000, // 5분 타임아웃 (복잡한 분석은 시간이 오래 걸릴 수 있음)
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.apiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        console.log("ChatAPI - Current access token:", token ? "Present" : "Missing");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("ChatAPI - Authorization header set");
        } else {
          console.log("ChatAPI - No token available, request will likely fail");
        }
        return config;
      },
    );

    // 응답 인터셉터 추가
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined;
        const currentToken = useAuthStore.getState().accessToken;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !!currentToken &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          const newToken = await authAPI.refreshAccessToken();

          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.apiClient(originalRequest);
          }

          useAuthStore.getState().clearSession();
        }

        if (error.response?.data) {
          const data = error.response.data as ApiErrorPayload;
          let errorMessage = "";

          // 구조화된 에러 응답 처리
          if (data.error) {
            if (typeof data.error === "string") {
              errorMessage = data.error;
            } else if (data.error.message) {
              errorMessage = data.error.message;
            } else {
              errorMessage = JSON.stringify(data.error);
            }
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.message) {
            errorMessage = data.message;
          } else {
            errorMessage = `Chat API Error: ${error.response.status}`;
          }

          // hint나 추가 정보가 있으면 추가
          if (data.hint) {
            errorMessage += `\n\n💡 ${data.hint}`;
          }

          const customError: Error & { code?: string } = new Error(
            errorMessage,
          );
          customError.code =
            data.code ||
            (typeof data.error === "object" ? data.error?.code : undefined);
          throw customError;
        }

        // 네트워크 에러 및 타임아웃 처리
        let errorMessage = "채팅 서버에 연결할 수 없습니다.";

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage = "응답 시간이 초과되었습니다. 복잡한 분석은 시간이 오래 걸릴 수 있으니 다시 시도해주세요.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      },
    );
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.apiClient.post<ChatResponse>(
        "/api/chat/query",
        request,
      );
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  }

  async startNewConversation(
    query: string,
    datasetId: string,
    options?: {
      model?: ChatModel;
      responseStyle?: ResponseStyle;
    },
  ): Promise<ChatResponse> {
    return this.sendMessage({
      query,
      dataset_id: datasetId,
      model: options?.model,
      response_style: options?.responseStyle,
    });
  }

  async continueConversation(
    query: string,
    datasetId: string,
    sessionId: string,
    options?: {
      model?: ChatModel;
      responseStyle?: ResponseStyle;
    },
  ): Promise<ChatResponse> {
    return this.sendMessage({
      query,
      dataset_id: datasetId,
      session_id: sessionId,
      model: options?.model,
      response_style: options?.responseStyle,
    });
  }

  async resumeSession(
    sessionId: string,
    approved: boolean,
    feedback?: string
  ): Promise<ResumeSessionResponse> {
    try {
      console.log("=== ChatAPI.resumeSession 호출 ===");
      console.log("sessionId:", sessionId);
      console.log("typeof sessionId:", typeof sessionId);
      console.log("approved:", approved);
      console.log("feedback:", feedback);
      console.log("URL:", `/api/agent/sessions/${sessionId}/resume`);

      const response = await this.apiClient.post<ResumeSessionResponse>(
        `/api/agent/sessions/${sessionId}/resume`,
        {
          approved,
          feedback,
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error("ChatAPI.resumeSession 오류:", error);
      throw error;
    }
  }
}

export const chatAPI = new ChatAPI();
