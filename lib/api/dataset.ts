import axios, { AxiosInstance } from 'axios';

export interface PreprocessingParams {
  min_genes?: number;
  min_cells?: number;
  max_genes?: number;
  max_mt_pct?: number;
  target_sum?: number;
  min_mean?: number;
  max_mean?: number;
  min_disp?: number;
  scale_max_value?: number;
  pca_svd_solver?: string;
  n_neighbors?: number;
  n_pcs?: number;
  resolution?: number;
}

export interface LoadDatasetRequest {
  source: string;
  preprocessing?: PreprocessingParams;
}

export interface LoadDatasetResponse {
  raw_id: string;
  dataset_id: string;
  status: string;
  raw_format: string;
  raw_path: string;
  dataset_path: string;
  n_cells: number;
  n_genes: number;
  plots: string[];
  extracted_params: PreprocessingParams;
  used_params: Record<string, any>;
  file_info: Record<string, any>;
}

// API 베이스 URL 설정 - Next.js API Routes 사용
const API_BASE_URL = '';  // 현재 도메인 사용

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5분 타임아웃 (큰 파일 처리를 위해)
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 로그 출력
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버가 응답을 반환했지만 상태 코드가 2xx 범위를 벗어남
      console.error('Response error:', error.response.status, error.response.data);

      const data = error.response.data;
      let message = '';

      // Google Drive 접근 오류 처리
      if (data?.error?.code === 'google_drive_access_denied') {
        message = `${data.error.message}\n\n💡 해결 방법: ${data.error.hint}`;
      } else if (data?.error) {
        // 다른 구조화된 에러
        message = typeof data.error === 'string' ? data.error : data.error.message || '서버 오류가 발생했습니다.';
        if (data.hint) {
          message += `\n\n💡 ${data.hint}`;
        }
      } else {
        // 일반 에러
        message = data?.detail || data?.message || `서버 오류: ${error.response.status}`;
      }

      const customError = new Error(message);
      (customError as any).code = data?.code || data?.error?.code;
      throw customError;
    } else if (error.request) {
      // 요청이 만들어졌지만 응답을 받지 못함
      console.error('No response:', error.request);
      throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
    } else {
      // 요청 설정 중 오류 발생
      console.error('Request setup error:', error.message);
      throw new Error(`요청 오류: ${error.message}`);
    }
  }
);

export class DatasetAPI {
  static async loadDataset(request: LoadDatasetRequest): Promise<LoadDatasetResponse> {
    try {
      // Next.js API Route를 통해 백엔드 호출
      const response = await apiClient.post<LoadDatasetResponse>('/api/datasets/load', request);
      return response.data;
    } catch (error) {
      console.error('Failed to load dataset:', error);
      throw error;
    }
  }

  // Step 1: 파라미터만 추출하기 위한 헬퍼 메서드
  static async extractParameters(source: string): Promise<PreprocessingParams> {
    const response = await this.loadDataset({ source });
    return response.extracted_params;
  }

  // Step 2: 파라미터와 함께 데이터셋 처리
  static async processDataset(
    source: string,
    preprocessing: PreprocessingParams
  ): Promise<LoadDatasetResponse> {
    return this.loadDataset({ source, preprocessing });
  }

  // 서버 상태 확인
  static async checkServerHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
}