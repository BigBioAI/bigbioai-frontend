import axios, { AxiosInstance } from 'axios';

export interface ChatRequest {
  query: string;
  dataset_id: string;
  session_id?: string;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  figures?: string[];
  error?: string;
}

export interface ChatError {
  error: string;
  code?: string;
  hint?: string;
}

class ChatAPI {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: '',  // Using Next.js API routes
      timeout: 60000, // 1분 타임아웃
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 응답 인터셉터 추가
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          const data = error.response.data;
          let errorMessage = '';

          // 구조화된 에러 응답 처리
          if (data.error) {
            if (typeof data.error === 'string') {
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

          const customError: Error & { code?: string } = new Error(errorMessage);
          customError.code = data.code || data.error?.code;
          throw customError;
        }

        // 네트워크 에러 등
        const errorMessage = error.message || '채팅 서버에 연결할 수 없습니다.';
        throw new Error(errorMessage);
      }
    );
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.apiClient.post<ChatResponse>('/api/chat/query', request);
      return response.data;
    } catch (error: unknown) {
      console.error('Chat API error:', error);
      throw error;
    }
  }

  async startNewConversation(query: string, datasetId: string): Promise<ChatResponse> {
    return this.sendMessage({
      query,
      dataset_id: datasetId,
    });
  }

  async continueConversation(query: string, datasetId: string, sessionId: string): Promise<ChatResponse> {
    return this.sendMessage({
      query,
      dataset_id: datasetId,
      session_id: sessionId,
    });
  }
}

export const chatAPI = new ChatAPI();